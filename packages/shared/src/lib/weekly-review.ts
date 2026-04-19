export type WeeklyReviewTier = "free" | "solo" | "pro" | "agency" | string | null | undefined;

export type WeeklyReviewWindow = {
  dateRangeStart: string;
  dateRangeEnd: string;
  compareRangeStart: string;
  compareRangeEnd: string;
};

export type WeeklyReviewFindingType =
  | "no_impressions"
  | "impressions_without_clicks"
  | "traffic_drop";

export type WeeklyReviewFinding = {
  type: WeeklyReviewFindingType;
  url: string;
  actionable: boolean;
  clicksCurrent: number;
  clicksCompare: number;
  impressionsCurrent: number;
  impressionsCompare: number;
  message: string;
};

export type WeeklyReviewPageMetrics = {
  page: string;
  clicks: number;
  impressions: number;
};

export type WeeklyReviewChangedPage = {
  url: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getWeeklyReviewLimit(tier: WeeklyReviewTier) {
  if (tier === "pro" || tier === "agency") return 10;
  return 1;
}

export function buildWeeklyReviewRunKey(input: {
  teamId: string;
  propertyId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
}) {
  return `${input.teamId}:${input.propertyId}:${input.dateRangeStart}:${input.dateRangeEnd}`;
}

export function getWeeklyReviewWindow(latestAvailableDate: string): WeeklyReviewWindow {
  const latest = parseDateOnly(latestAvailableDate);
  const day = latest.getUTCDay();
  const daysSinceSunday = day === 0 ? 0 : day;
  const currentEnd = addDays(latest, -daysSinceSunday);
  const currentStart = addDays(currentEnd, -6);
  const compareEnd = addDays(currentStart, -1);
  const compareStart = addDays(compareEnd, -6);

  return {
    dateRangeStart: formatDateOnly(currentStart),
    dateRangeEnd: formatDateOnly(currentEnd),
    compareRangeStart: formatDateOnly(compareStart),
    compareRangeEnd: formatDateOnly(compareEnd),
  };
}

export function shouldRunWeeklyScheduler(now: Date, timeZone = "Europe/Berlin") {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(now);
  return weekday === "Sun";
}

export function buildWeeklyReviewFindings(input: {
  changedPages: WeeklyReviewChangedPage[];
  currentPages: WeeklyReviewPageMetrics[];
  comparePages: WeeklyReviewPageMetrics[];
}): WeeklyReviewFinding[] {
  const currentByUrl = new Map(input.currentPages.map((row) => [normalizeUrl(row.page), row]));
  const compareByUrl = new Map(input.comparePages.map((row) => [normalizeUrl(row.page), row]));
  const findings: WeeklyReviewFinding[] = [];

  for (const page of input.changedPages) {
    const url = normalizeUrl(page.url);
    const current = currentByUrl.get(url);
    const compare = compareByUrl.get(url);
    const clicksCurrent = current?.clicks ?? 0;
    const clicksCompare = compare?.clicks ?? 0;
    const impressionsCurrent = current?.impressions ?? 0;
    const impressionsCompare = compare?.impressions ?? 0;

    if (impressionsCurrent === 0) {
      findings.push({
        type: "no_impressions",
        url: page.url,
        actionable: true,
        clicksCurrent,
        clicksCompare,
        impressionsCurrent,
        impressionsCompare,
        message: "Changed page received no Google impressions in the evaluated week.",
      });
      continue;
    }

    if (impressionsCurrent > impressionsCompare && clicksCurrent <= clicksCompare) {
      findings.push({
        type: "impressions_without_clicks",
        url: page.url,
        actionable: true,
        clicksCurrent,
        clicksCompare,
        impressionsCurrent,
        impressionsCompare,
        message: "Google impressions increased, but clicks did not improve.",
      });
      continue;
    }

    if (clicksCurrent < clicksCompare || impressionsCurrent < impressionsCompare) {
      findings.push({
        type: "traffic_drop",
        url: page.url,
        actionable: true,
        clicksCurrent,
        clicksCompare,
        impressionsCurrent,
        impressionsCompare,
        message: "Clicks or impressions dropped after the detected page change.",
      });
    }
  }

  return findings;
}
