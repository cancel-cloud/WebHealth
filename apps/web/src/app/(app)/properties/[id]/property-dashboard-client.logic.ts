import type { LiveDashboardData, SourceFreshness } from "@webhealth/shared/lib/live-dashboard";

export type ActionFilter =
  | "all"
  | "critical"
  | "in_progress"
  | "open"
  | "done"
  | "ignored_snoozed"
  | "crawl"
  | "seo"
  | "content"
  | "performance";

export function buildDashboardHref(next: {
  propertyId: string;
  currentSearchParams: string;
  preset: string;
  compareMode: string;
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams(next.currentSearchParams);
  params.set("preset", next.preset);
  params.set("compare", next.compareMode);
  params.set("end", next.endDate);

  if (next.preset === "custom") {
    params.set("start", next.startDate);
  } else {
    params.delete("start");
  }

  return `/properties/${encodeURIComponent(next.propertyId)}?${params.toString()}`;
}

export function getSourceLabel(source: SourceFreshness["source"]) {
  if (source === "ga4") return "GA4";
  if (source === "crawl") return "Crawl";
  return "Search Console";
}

export function formatSourceDateCoverage(value: string | null) {
  if (!value) return "No safe date";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "No safe date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getPriorityModel(rank: number | null | undefined) {
  const safeRank = Number.isFinite(rank ?? NaN) && (rank ?? 0) > 0 ? Math.round(rank as number) : 4;
  if (safeRank <= 1) {
    return {
      label: "P1",
      tone: "critical" as const,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (safeRank <= 3) {
    return {
      label: `P${safeRank}`,
      tone: "high" as const,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }
  if (safeRank <= 6) {
    return {
      label: `P${safeRank}`,
      tone: "medium" as const,
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }
  return {
    label: `P${safeRank}`,
    tone: "low" as const,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function getActionCategoryModel(action: {
  recommendationClass?: string | null;
  causeFamily?: string | null;
  actionFamily?: string | null;
}) {
  const haystack = [
    action.recommendationClass,
    action.causeFamily,
    action.actionFamily,
  ].join(" ").toLowerCase();

  if (haystack.includes("technical") || haystack.includes("crawl") || haystack.includes("index")) {
    return {
      label: "Crawl",
      tone: "crawl" as const,
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    };
  }
  if (haystack.includes("performance") || haystack.includes("web_vitals") || haystack.includes("lcp")) {
    return {
      label: "Perf",
      tone: "performance" as const,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }
  if (haystack.includes("content")) {
    return {
      label: "Content",
      tone: "content" as const,
      className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    };
  }
  return {
    label: "SEO",
    tone: "seo" as const,
    className: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

export function getSeverityValue(input: {
  rank?: number | null;
  systemScore?: number | null;
}) {
  if (typeof input.systemScore === "number" && Number.isFinite(input.systemScore)) {
    return Math.max(1, Math.min(5, Math.ceil((input.systemScore / 100) * 5)));
  }

  const rank = input.rank ?? 99;
  if (rank <= 1) return 5;
  if (rank <= 3) return 4;
  if (rank <= 6) return 3;
  if (rank <= 10) return 2;
  return 1;
}

export function buildSparklinePath(values: number[], width = 96, height = 28) {
  const realValues = values.filter((value) => Number.isFinite(value));
  if (realValues.length < 2) return null;

  const min = Math.min(...realValues);
  const max = Math.max(...realValues);
  const range = max - min || 1;
  const step = width / (realValues.length - 1);

  return realValues
    .map((value, index) => {
      const x = Number((index * step).toFixed(2));
      const y = Number((height - ((value - min) / range) * height).toFixed(2));
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "property";
}

export function buildSnapshotDownload(params: {
  dashboard: Partial<Pick<LiveDashboardData, "payloadVersion">> & {
    property: Pick<LiveDashboardData["property"], "id" | "name">;
    analysisWindow: Pick<LiveDashboardData["analysisWindow"], "startDate" | "requestedEndDate">;
  };
  brandColors: { primary: string; accent: string };
}) {
  const startDate = params.dashboard.analysisWindow.startDate;
  const endDate = params.dashboard.analysisWindow.requestedEndDate;
  return {
    filename: `webhealth-${slugify(params.dashboard.property.name)}-${startDate}-${endDate}.json`,
    payload: {
      metadata: {
        exportType: "dashboard_snapshot_json",
        createdAt: new Date().toISOString(),
        propertyId: params.dashboard.property.id,
        propertyName: params.dashboard.property.name,
        startDate,
        endDate,
        payloadVersion: params.dashboard.payloadVersion ?? null,
      },
      brandColors: params.brandColors,
      dashboard: params.dashboard,
    },
  };
}

export function filterDashboardActions<T extends {
  state: string;
  rank: number;
  recommendationClass: string;
  causeFamily: string;
}>(actions: T[], filter: ActionFilter): T[] {
  if (filter === "all") return actions;
  if (filter === "critical") return actions.filter((action) => action.rank <= 2);
  if (filter === "in_progress") return actions.filter((action) => action.state === "in_progress");
  if (filter === "open") return actions.filter((action) => action.state === "open");
  if (filter === "done") return actions.filter((action) => action.state === "done");
  if (filter === "ignored_snoozed") {
    return actions.filter((action) => action.state === "ignored" || action.state === "snoozed");
  }
  if (filter === "crawl") {
    return actions.filter((action) =>
      action.causeFamily.includes("technical") ||
      action.recommendationClass.includes("technical") ||
      action.recommendationClass.includes("crawl"),
    );
  }
  if (filter === "seo") {
    return actions.filter((action) =>
      action.causeFamily.includes("ctr") ||
      action.causeFamily.includes("near") ||
      action.causeFamily.includes("cannibal") ||
      action.recommendationClass.includes("seo"),
    );
  }
  if (filter === "content") {
    return actions.filter((action) =>
      action.causeFamily.includes("content") ||
      action.recommendationClass.includes("content"),
    );
  }
  return actions.filter((action) =>
    action.causeFamily.includes("performance") ||
    action.recommendationClass.includes("performance"),
  );
}
