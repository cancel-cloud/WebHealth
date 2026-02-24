import { google } from "googleapis";

export function getGoogleAuthClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.BETTER_AUTH_URL
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
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

export type GscMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
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

export type Ga4Metrics = {
  sessions: number;
  users: number;
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
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    },
  });

  const row = response.data.rows?.[0]?.metricValues;
  return {
    sessions: parseInt(row?.[0]?.value ?? "0"),
    users: parseInt(row?.[1]?.value ?? "0"),
  };
}

