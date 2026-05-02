export type AppSidebarIconKey =
  | "dashboard"
  | "properties"
  | "settings"
  | "support"
  | "mail"
  | "sparkles"
  | "refresh"
  | "users"
  | "logs"
  | "flags"
  | "sliders"
  | "bot"
  | "bug";

export type AppSidebarActionKey = "feature-request";

type AppSidebarItemBase = {
  id: string;
  label: string;
  icon: AppSidebarIconKey;
  current: boolean;
};

type AppSidebarLinkItem = AppSidebarItemBase & {
  href: string;
  external?: boolean;
  action?: never;
};

type AppSidebarActionItem = AppSidebarItemBase & {
  action: AppSidebarActionKey;
  href?: never;
  external?: never;
};

export type AppSidebarItem = AppSidebarLinkItem | AppSidebarActionItem;

export type AppSidebarGroup = {
  label: string;
  icon: AppSidebarIconKey;
  current: boolean;
  items: AppSidebarItem[];
};

export type AppSidebarModel = {
  primaryItems: AppSidebarItem[];
  adminItems: AppSidebarItem[];
  supportGroup: AppSidebarGroup;
};

export function getAppSidebarFooterThemeOptions() {
  return [
    { value: "system" as const, label: "System" },
    { value: "light" as const, label: "Lightmode" },
    { value: "dark" as const, label: "Darkmode" },
  ];
}

export function getAppSidebarThemeChoiceClasses({
  active,
  first,
  last,
}: {
  active: boolean;
  first: boolean;
  last: boolean;
}) {
  return [
    "flex w-full items-center justify-start gap-3 px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
    !first && "border-t border-border/70",
    first && "rounded-t-lg",
    last && "rounded-b-lg",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getAppSidebarItemClasses({
  current,
  nested,
}: {
  current: boolean;
  nested: boolean;
}) {
  return {
    link: current
      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
      : "text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    icon: current
      ? "text-sidebar-accent-foreground"
      : nested
        ? "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground"
        : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
  };
}

function isPathCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSettingsCurrent(pathname: string, tab: string | null, href: string) {
  if (!(pathname === href || pathname.startsWith(`${href}/`))) return false;
  return !(pathname === href && tab === "contact");
}

export function getAppSidebarModel({
  pathname,
  isAdmin,
  tab = null,
  view = null,
}: {
  pathname: string;
  isAdmin: boolean;
  tab?: string | null;
  view?: string | null;
}): AppSidebarModel {
  const aiInsightsCurrent = pathname === "/dashboard" && view === "ai-insights";
  const primaryItems: AppSidebarItem[] = [
    {
      id: "dashboard",
      label: "Overview",
      href: "/dashboard",
      icon: "dashboard",
      current: isPathCurrent(pathname, "/dashboard") && !aiInsightsCurrent,
    },
    {
      id: "properties",
      label: "Properties",
      href: "/properties",
      icon: "properties",
      current: isPathCurrent(pathname, "/properties"),
    },
    {
      id: "ai-insights",
      label: "AI Insights",
      href: "/dashboard?view=ai-insights",
      icon: "bot",
      current: aiInsightsCurrent,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/settings",
      icon: "settings",
      current: isSettingsCurrent(pathname, tab, "/settings"),
    },
  ];

  const adminItems: AppSidebarItem[] = isAdmin
    ? [
        {
          id: "admin-syncing",
          label: "Syncing",
          href: "/admin/syncing",
          icon: "refresh",
          current: isPathCurrent(pathname, "/admin/syncing"),
        },
        {
          id: "admin-users",
          label: "User Management",
          href: "/admin/users",
          icon: "users",
          current: isPathCurrent(pathname, "/admin/users"),
        },
        {
          id: "admin-feedback",
          label: "Feedback Inbox",
          href: "/admin/feedback",
          icon: "mail",
          current: isPathCurrent(pathname, "/admin/feedback"),
        },
        {
          id: "admin-product-analytics",
          label: "Product Analytics",
          href: "/admin/product-analytics",
          icon: "sparkles",
          current: isPathCurrent(pathname, "/admin/product-analytics"),
        },
        {
          id: "admin-logs",
          label: "System Logs",
          href: "/admin/logs",
          icon: "logs",
          current: isPathCurrent(pathname, "/admin/logs"),
        },
        {
          id: "admin-feature-flags",
          label: "Feature Flags",
          href: "/admin/feature-flags",
          icon: "flags",
          current: isPathCurrent(pathname, "/admin/feature-flags"),
        },
        {
          id: "admin-global-settings",
          label: "Global Settings",
          href: "/admin/global-settings",
          icon: "sliders",
          current: isPathCurrent(pathname, "/admin/global-settings"),
        },
        {
          id: "admin-ai-prompts",
          label: "AI Prompts",
          href: "/admin/ai-prompts",
          icon: "bot",
          current: isPathCurrent(pathname, "/admin/ai-prompts"),
        },
        {
          id: "admin-ai-report-debug",
          label: "Ops Debug Console",
          href: "/admin/ai-report-debug",
          icon: "bug",
          current: isPathCurrent(pathname, "/admin/ai-report-debug"),
        },
        {
          id: "admin-glitchtip-test",
          label: "GlitchTip Test",
          href: "/admin/glitchtip-test",
          icon: "bug",
          current: isPathCurrent(pathname, "/admin/glitchtip-test"),
        },
      ]
    : [];

  const supportItems: AppSidebarItem[] = [
    {
      id: "contact-support",
      label: "Contact Support",
      href: "/settings?tab=contact",
      icon: "mail",
      current: pathname === "/settings" && tab === "contact",
    },
    {
      id: "feature-request",
      label: "Feature Requests",
      icon: "sparkles",
      current: false,
      action: "feature-request",
    },
  ];

  return {
    primaryItems,
    adminItems,
    supportGroup: {
      label: "Support",
      icon: "support",
      current: supportItems.some((item) => item.current),
      items: supportItems,
    },
  };
}
