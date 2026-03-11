import { formatPlanName, getPlanStatusLabel } from "@/lib/plan-label";

export type Settings = {
  weeklyDigest: boolean;
  reportComplete: boolean;
  syncFailure: boolean;
  emailReceipts: boolean;
  reportLanguage: string;
  isRestricted?: boolean;
  restrictionMessage?: string | null;
  adminContacts?: string[];
  teamTier?: string;
  hasStripeCustomer?: boolean;
  subscriptionCancelAt?: string | null;
  reportsThisMonth?: number;
  reportsLimit?: number | null;
  detailsThisMonth?: number;
  detailsLimit?: number | null;
};

export type SettingsTab = "account" | "contact";

export function getSettingsPlanCardLayoutClassNames() {
  return {
    card: "h-full rounded-lg border p-6 shadow-sm",
    featuredCard: "pt-8",
    content: "flex h-full flex-col gap-4",
    action: "mt-auto w-full",
  };
}

export function normalizeSettingsResponse(data: unknown): Settings {
  const source = (data ?? {}) as Record<string, unknown>;

  return {
    weeklyDigest: Boolean(source.weeklyDigest),
    reportComplete: Boolean(source.reportComplete),
    syncFailure: Boolean(source.syncFailure),
    emailReceipts: Boolean(source.emailReceipts),
    reportLanguage: typeof source.reportLanguage === "string" ? source.reportLanguage : "auto",
    isRestricted: Boolean(source.isRestricted),
    restrictionMessage: typeof source.restrictionMessage === "string" ? source.restrictionMessage : null,
    adminContacts: Array.isArray(source.adminContacts)
      ? source.adminContacts.filter((value): value is string => typeof value === "string")
      : [],
    teamTier: typeof source.teamTier === "string" ? source.teamTier : "free",
    hasStripeCustomer: Boolean(source.hasStripeCustomer),
    subscriptionCancelAt:
      typeof source.subscriptionCancelAt === "string" ? source.subscriptionCancelAt : null,
    reportsThisMonth: typeof source.reportsThisMonth === "number" ? source.reportsThisMonth : 0,
    reportsLimit: typeof source.reportsLimit === "number" ? source.reportsLimit : null,
    detailsThisMonth: typeof source.detailsThisMonth === "number" ? source.detailsThisMonth : 0,
    detailsLimit: typeof source.detailsLimit === "number" ? source.detailsLimit : null,
  };
}

export function getSettingsAccountSummary(settings: Pick<Settings, "teamTier" | "subscriptionCancelAt" | "reportsThisMonth" | "reportsLimit" | "detailsThisMonth" | "detailsLimit">) {
  return {
    planLabel: formatPlanName(settings.teamTier),
    planStatus: getPlanStatusLabel(settings.subscriptionCancelAt),
    usage: {
      reportsThisMonth: settings.reportsThisMonth ?? 0,
      reportsLimit: settings.reportsLimit ?? null,
      detailsThisMonth: settings.detailsThisMonth ?? 0,
      detailsLimit: settings.detailsLimit ?? null,
    },
  };
}

export function resolveSettingsTab(tab: string | null): SettingsTab {
  return tab === "contact" ? "contact" : "account";
}
