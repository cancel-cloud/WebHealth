import { google } from "googleapis";

export function getGoogleAuthClient(
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date | null,
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.BETTER_AUTH_URL
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt?.getTime(),
  });

  return oauth2Client;
}

export async function fetchGscProperties(authClient: any) {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const response = await searchConsole.sites.list();
  return response.data.siteEntry || [];
}

export type Ga4PropertyInfo = {
  propertyId: string;   // numeric, e.g. "123456789"
  displayName: string;  // e.g. "example.com" or "My Site"
};

export async function fetchGa4Properties(authClient: any): Promise<Ga4PropertyInfo[]> {
  const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth: authClient });
  const response = await analyticsAdmin.accountSummaries.list();
  const summaries = response.data.accountSummaries || [];

  const flat: Ga4PropertyInfo[] = [];
  for (const account of summaries) {
    for (const prop of (account.propertySummaries || [])) {
      if (!prop.property || !prop.displayName) continue;
      // prop.property is like "properties/123456789"
      const propertyId = prop.property.replace("properties/", "");
      flat.push({ propertyId, displayName: prop.displayName });
    }
  }
  return flat;
}

export async function fetchGscDataStartDate(
  authClient: any,
  siteUrl: string
): Promise<string | null> {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 3);
  const endDate = yesterday.toISOString().slice(0, 10);

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: "2019-01-01",
      endDate,
      dimensions: ["date"],
      rowLimit: 1,
    },
  });

  const firstRow = response.data.rows?.[0];
  return (firstRow as any)?.keys?.[0] ?? null;
}

export type GscMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
};

export type GscDayMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
  topCountries: { country: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topDevices: { device: string; clicks: number; impressions: number; ctr: number; position: number }[];
};

export type GscQueryPagePair = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export async function fetchGscMetrics(
  authClient: any,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GscMetrics> {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });

  // Fetch summary (overall)
  const summaryRes = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions: [], rowLimit: 1 },
  });
  const summaryRow = summaryRes.data.rows?.[0];

  // Fetch top queries
  const queriesRes = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: 25 },
  });

  // Fetch top pages
  const pagesRes = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 25 },
  });

  return {
    clicks: summaryRow?.clicks ?? 0,
    impressions: summaryRow?.impressions ?? 0,
    ctr: summaryRow?.ctr ?? 0,
    position: summaryRow?.position ?? 0,
    topQueries: (queriesRes.data.rows ?? []).map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
    topPages: (pagesRes.data.rows ?? []).map((row: any) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
    })),
  };
}

export async function fetchGscQueryPagePairs(
  authClient: any,
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit = 2500
): Promise<GscQueryPagePair[]> {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });
  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit,
    },
  });

  return (response.data.rows ?? []).map((row) => {
    const rowRecord = row as Record<string, unknown>;
    const keys = Array.isArray(rowRecord.keys) ? (rowRecord.keys as string[]) : [];
    return {
      query: keys[0] ?? "",
      page: keys[1] ?? "",
      clicks: typeof rowRecord.clicks === "number" ? rowRecord.clicks : 0,
      impressions: typeof rowRecord.impressions === "number" ? rowRecord.impressions : 0,
      ctr: typeof rowRecord.ctr === "number" ? rowRecord.ctr : 0,
      position: typeof rowRecord.position === "number" ? rowRecord.position : 0,
    };
  });
}

/**
 * Batch-fetches GSC data for a full date range in 5 API calls (vs 3 per day).
 * Returns a Map keyed by date string (YYYY-MM-DD).
 */
export async function fetchGscMetricsBatch(
  authClient: any,
  siteUrl: string,
  dateStart: string,
  dateEnd: string
): Promise<Map<string, GscDayMetrics>> {
  const searchConsole = google.webmasters({ version: "v3", auth: authClient });

  // Run all 5 dimension queries in parallel
  const [dailyRes, queriesRes, pagesRes, countriesRes, devicesRes] = await Promise.all([
    // 1. Daily summary
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date"], rowLimit: 25000 },
    }),
    // 2. Daily top queries
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "query"], rowLimit: 25000 },
    }),
    // 3. Daily top pages
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "page"], rowLimit: 25000 },
    }),
    // 4. Daily country breakdown
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "country"], rowLimit: 25000 },
    }),
    // 5. Daily device breakdown
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: dateStart, endDate: dateEnd, dimensions: ["date", "device"], rowLimit: 25000 },
    }),
  ]);

  // Build a base map from the daily summary rows
  const dayMap = new Map<string, GscDayMetrics>();

  for (const row of (dailyRes.data.rows ?? [])) {
    const date = (row as any).keys[0] as string;
    dayMap.set(date, {
      clicks: (row as any).clicks ?? 0,
      impressions: (row as any).impressions ?? 0,
      ctr: (row as any).ctr ?? 0,
      position: (row as any).position ?? 0,
      topQueries: [],
      topPages: [],
      topCountries: [],
      topDevices: [],
    });
  }

  // Attach top queries per day (keep top 25 by clicks)
  const queriesByDay = new Map<string, { query: string; clicks: number; impressions: number; ctr: number; position: number }[]>();
  for (const row of (queriesRes.data.rows ?? [])) {
    const [date, query] = (row as any).keys as string[];
    if (!queriesByDay.has(date)) queriesByDay.set(date, []);
    queriesByDay.get(date)!.push({
      query,
      clicks: (row as any).clicks ?? 0,
      impressions: (row as any).impressions ?? 0,
      ctr: (row as any).ctr ?? 0,
      position: (row as any).position ?? 0,
    });
  }

  // Attach top pages per day (keep top 25 by clicks)
  const pagesByDay = new Map<string, { page: string; clicks: number; impressions: number }[]>();
  for (const row of (pagesRes.data.rows ?? [])) {
    const [date, page] = (row as any).keys as string[];
    if (!pagesByDay.has(date)) pagesByDay.set(date, []);
    pagesByDay.get(date)!.push({
      page,
      clicks: (row as any).clicks ?? 0,
      impressions: (row as any).impressions ?? 0,
    });
  }

  // Attach countries per day
  const countriesByDay = new Map<string, { country: string; clicks: number; impressions: number; ctr: number; position: number }[]>();
  for (const row of (countriesRes.data.rows ?? [])) {
    const [date, country] = (row as any).keys as string[];
    if (!countriesByDay.has(date)) countriesByDay.set(date, []);
    countriesByDay.get(date)!.push({
      country,
      clicks: (row as any).clicks ?? 0,
      impressions: (row as any).impressions ?? 0,
      ctr: (row as any).ctr ?? 0,
      position: (row as any).position ?? 0,
    });
  }

  // Attach devices per day
  const devicesByDay = new Map<string, { device: string; clicks: number; impressions: number; ctr: number; position: number }[]>();
  for (const row of (devicesRes.data.rows ?? [])) {
    const [date, device] = (row as any).keys as string[];
    if (!devicesByDay.has(date)) devicesByDay.set(date, []);
    devicesByDay.get(date)!.push({
      device,
      clicks: (row as any).clicks ?? 0,
      impressions: (row as any).impressions ?? 0,
      ctr: (row as any).ctr ?? 0,
      position: (row as any).position ?? 0,
    });
  }

  // Merge all dimension data into the day map
  for (const [date, entry] of dayMap) {
    const queries = queriesByDay.get(date) ?? [];
    entry.topQueries = queries.sort((a, b) => b.clicks - a.clicks).slice(0, 25);

    const pages = pagesByDay.get(date) ?? [];
    entry.topPages = pages.sort((a, b) => b.clicks - a.clicks).slice(0, 25);

    entry.topCountries = countriesByDay.get(date) ?? [];
    entry.topDevices = devicesByDay.get(date) ?? [];
  }

  return dayMap;
}

export type Ga4Metrics = {
  sessions: number;
  users: number;
  newUsers: number;
};

export async function fetchGa4Metrics(
  authClient: any,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<Ga4Metrics> {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });

  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "newUsers" }],
    },
  });

  const row = response.data.rows?.[0]?.metricValues;
  return {
    sessions: parseInt(row?.[0]?.value ?? "0"),
    users: parseInt(row?.[1]?.value ?? "0"),
    newUsers: parseInt(row?.[2]?.value ?? "0"),
  };
}

/**
 * Fetches GA4 daily summaries for a full date range in 1 API call (vs 1 per day).
 * Returns a Map keyed by date string (YYYYMMDD from GA4 → normalized to YYYY-MM-DD).
 */
export async function fetchGa4DailySummary(
  authClient: any,
  propertyId: string,
  dateStart: string,
  dateEnd: string
): Promise<Map<string, { sessions: number; users: number; newUsers: number }>> {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });

  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: dateStart, endDate: dateEnd }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
      ],
    },
  });

  const result = new Map<string, { sessions: number; users: number; newUsers: number }>();

  for (const row of (response.data.rows ?? [])) {
    // GA4 returns date as YYYYMMDD, normalize to YYYY-MM-DD
    const rawDate = row.dimensionValues?.[0]?.value ?? "";
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;
    const mv = row.metricValues ?? [];
    result.set(date, {
      sessions: parseInt(mv[0]?.value ?? "0"),
      users: parseInt(mv[1]?.value ?? "0"),
      newUsers: parseInt(mv[2]?.value ?? "0"),
    });
  }

  return result;
}

export type Ga4ReportProfile = {
  topPages: { pagePath: string; pageviews: number; sessions: number }[];
  trafficSources: { medium: string; sessions: number; users: number }[];
  deviceBreakdown: { device: string; sessions: number; users: number }[];
  countryBreakdown: { country: string; users: number; sessions: number }[];
  events: { eventName: string; eventCount: number; totalUsers: number }[];
  osBreakdown: { os: string; sessions: number }[];
  landingPages: { landingPage: string; sessions: number; pageviews: number }[];
  acquisitionChannels: { channel: string; users: number }[];
};

/**
 * Fetches a rich GA4 profile for a single date period using 2 batchRunReports calls.
 * Avoids the `dateRange` meta-dimension which some GA4 property types reject.
 */
async function fetchGa4ProfileForPeriod(
  analyticsData: ReturnType<typeof google.analyticsdata>,
  property: string,
  startDate: string,
  endDate: string
): Promise<Ga4ReportProfile> {
  const dateRanges = [{ startDate, endDate }];

  function parseRows<T>(
    report: any,
    mapper: (dimValues: string[], metricValues: string[]) => T
  ): T[] {
    return (report?.rows ?? []).map((row: any) => {
      const dims: string[] = (row.dimensionValues ?? []).map((d: any) => d.value ?? "");
      const mets: string[] = (row.metricValues ?? []).map((m: any) => m.value ?? "0");
      return mapper(dims, mets);
    });
  }

  const [batch1Res, batch2Res] = await Promise.all([
    analyticsData.properties.batchRunReports({
      property,
      requestBody: {
        requests: [
          {
            dateRanges,
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
            limit: "25",
          },
          {
            dateRanges,
            dimensions: [{ name: "sessionMedium" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }],
            limit: "25",
          },
          {
            dateRanges,
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }],
          },
          {
            dateRanges,
            dimensions: [{ name: "country" }],
            metrics: [{ name: "totalUsers" }, { name: "sessions" }],
            limit: "25",
          },
          {
            dateRanges,
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
            limit: "25",
          },
        ],
      },
    }),
    analyticsData.properties.batchRunReports({
      property,
      requestBody: {
        requests: [
          {
            dateRanges,
            dimensions: [{ name: "operatingSystem" }],
            metrics: [{ name: "sessions" }],
            limit: "10",
          },
          {
            dateRanges,
            dimensions: [{ name: "landingPage" }],
            metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
            limit: "25",
          },
          {
            dateRanges,
            dimensions: [{ name: "firstUserMedium" }],
            metrics: [{ name: "totalUsers" }],
            limit: "25",
          },
        ],
      },
    }),
  ]);

  const reports1 = batch1Res.data.reports ?? [];
  const reports2 = batch2Res.data.reports ?? [];

  return {
    topPages: parseRows(reports1[0], (dims, mets) => ({
      pagePath: dims[0],
      pageviews: parseInt(mets[0]),
      sessions: parseInt(mets[1]),
    })),
    trafficSources: parseRows(reports1[1], (dims, mets) => ({
      medium: dims[0],
      sessions: parseInt(mets[0]),
      users: parseInt(mets[1]),
    })),
    deviceBreakdown: parseRows(reports1[2], (dims, mets) => ({
      device: dims[0],
      sessions: parseInt(mets[0]),
      users: parseInt(mets[1]),
    })),
    countryBreakdown: parseRows(reports1[3], (dims, mets) => ({
      country: dims[0],
      users: parseInt(mets[0]),
      sessions: parseInt(mets[1]),
    })),
    events: parseRows(reports1[4], (dims, mets) => ({
      eventName: dims[0],
      eventCount: parseInt(mets[0]),
      totalUsers: parseInt(mets[1]),
    })),
    osBreakdown: parseRows(reports2[0], (dims, mets) => ({
      os: dims[0],
      sessions: parseInt(mets[0]),
    })),
    landingPages: parseRows(reports2[1], (dims, mets) => ({
      landingPage: dims[0],
      sessions: parseInt(mets[0]),
      pageviews: parseInt(mets[1]),
    })),
    acquisitionChannels: parseRows(reports2[2], (dims, mets) => ({
      channel: dims[0],
      users: parseInt(mets[0]),
    })),
  };
}

/**
 * Fetches a rich GA4 profile for both the current and compare periods.
 * Runs all 4 batch calls in parallel (2 per period) for minimal latency.
 */
export async function fetchGa4ReportProfile(
  authClient: any,
  propertyId: string,
  currentStart: string,
  currentEnd: string,
  compareStart: string,
  compareEnd: string
): Promise<{ current: Ga4ReportProfile; compare: Ga4ReportProfile }> {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
  const property = `properties/${propertyId}`;

  const [current, compare] = await Promise.all([
    fetchGa4ProfileForPeriod(analyticsData, property, currentStart, currentEnd),
    fetchGa4ProfileForPeriod(analyticsData, property, compareStart, compareEnd),
  ]);

  return { current, compare };
}
