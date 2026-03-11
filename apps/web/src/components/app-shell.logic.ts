export type AppSidebarIconKey =
  | "dashboard"
  | "reports"
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

export type AppSidebarItem = {
  label: string;
  href: string;
  icon: AppSidebarIconKey;
  current: boolean;
  external?: boolean;
};

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
  if (pathname !== href) return false;
  return tab !== "contact";
}

export function getAppSidebarModel({
  pathname,
  isAdmin,
  tab = null,
}: {
  pathname: string;
  isAdmin: boolean;
  tab?: string | null;
}): AppSidebarModel {
  const primaryItems: AppSidebarItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      current: isPathCurrent(pathname, "/dashboard"),
    },
    {
      label: "Reports",
      href: "/reports",
      icon: "reports",
      current: isPathCurrent(pathname, "/reports"),
    },
    {
      label: "Properties",
      href: "/properties",
      icon: "properties",
      current: isPathCurrent(pathname, "/properties"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: "settings",
      current: isSettingsCurrent(pathname, tab, "/settings"),
    },
  ];

  const adminItems: AppSidebarItem[] = isAdmin
    ? [
        {
          label: "Syncing",
          href: "/admin/syncing",
          icon: "refresh",
          current: isPathCurrent(pathname, "/admin/syncing"),
        },
        {
          label: "User Management",
          href: "/admin/users",
          icon: "users",
          current: isPathCurrent(pathname, "/admin/users"),
        },
        {
          label: "System Logs",
          href: "/admin/logs",
          icon: "logs",
          current: isPathCurrent(pathname, "/admin/logs"),
        },
        {
          label: "Feature Flags",
          href: "/admin/feature-flags",
          icon: "flags",
          current: isPathCurrent(pathname, "/admin/feature-flags"),
        },
        {
          label: "Global Settings",
          href: "/admin/global-settings",
          icon: "sliders",
          current: isPathCurrent(pathname, "/admin/global-settings"),
        },
        {
          label: "AI Report Settings",
          href: "/admin/ai-report-settings",
          icon: "bot",
          current: isPathCurrent(pathname, "/admin/ai-report-settings"),
        },
        {
          label: "AI Debug Console",
          href: "/admin/ai-report-debug",
          icon: "bug",
          current: isPathCurrent(pathname, "/admin/ai-report-debug"),
        },
      ]
    : [];

  const supportItems: AppSidebarItem[] = [
    {
      label: "Contact Support",
      href: "/settings?tab=contact",
      icon: "mail",
      current: pathname === "/settings" && tab === "contact",
    },
    {
      label: "Feature Requests",
      href: "https://github.com/cancel-cloud/WebHealth/discussions",
      icon: "sparkles",
      current: false,
      external: true,
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
