"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { cn } from "@webhealth/shared/lib/utils";
import {
  getAppSidebarFooterThemeOptions,
  getAppSidebarItemClasses,
  getAppSidebarModel,
  getAppSidebarThemeChoiceClasses,
  type AppSidebarIconKey,
  type AppSidebarItem,
} from "./app-shell.logic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPlanName } from "@/lib/plan-label";
import { requestJson } from "@/lib/client/api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UsageCard } from "@/components/usage-card";
import {
  Bot,
  Bug,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Flag,
  Globe,
  LayoutDashboard,
  Mail,
  MessageSquare,
  LogOut,
  Monitor,
  Moon,
  RefreshCw,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type SidebarMeta = {
  teamTier: string;
  reportsThisMonth: number;
  reportsLimit: number | null;
  detailsThisMonth: number;
  detailsLimit: number | null;
  reportableProperties: SidebarProperty[];
};

type SidebarProperty = {
  id: string;
  label: string;
  gscUrl: string | null;
  sourceCoverage: "linked" | "gsc_only" | "ga4_only";
};

const ICONS: Record<
  AppSidebarIconKey,
  React.ComponentType<{ className?: string }>
> = {
  dashboard: LayoutDashboard,
  reports: FileText,
  properties: Globe,
  settings: Settings,
  support: CircleHelp,
  mail: Mail,
  sparkles: Sparkles,
  refresh: RefreshCw,
  users: Users,
  logs: ScrollText,
  flags: Flag,
  sliders: SlidersHorizontal,
  bot: Bot,
  bug: Bug,
};

function SidebarLink({
  item,
  onNavigate,
  onFeatureRequest,
  nested = false,
  badge,
}: {
  item: AppSidebarItem;
  onNavigate?: () => void;
  onFeatureRequest?: () => void;
  nested?: boolean;
  badge?: number;
}) {
  const Icon = ICONS[item.icon];
  const stateClasses = getAppSidebarItemClasses({
    current: item.current,
    nested,
  });
  const className = cn(
    "group flex w-full items-center gap-3 rounded-lg text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
    nested ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm font-medium",
    stateClasses.link,
  );

  const content = (
    <>
      <Icon
        className={cn(
          "shrink-0",
          nested ? "h-4 w-4" : "h-4 w-4",
          stateClasses.icon,
        )}
      />
      <span className="truncate">{item.label}</span>
      {typeof badge === "number" ? (
        <span className="ml-auto shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
          {badge}
        </span>
      ) : null}
    </>
  );

  if ("action" in item) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          onNavigate?.();
          onFeatureRequest?.();
        }}
      >
        {content}
      </button>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function getSidebarPropertyInitial(label: string) {
  return label.trim().charAt(0).toUpperCase() || "W";
}

function getSidebarPropertyStatusClasses(
  sourceCoverage: SidebarProperty["sourceCoverage"],
) {
  if (sourceCoverage === "linked") return "bg-emerald-500";
  if (sourceCoverage === "gsc_only") return "bg-amber-500";
  return "bg-rose-500";
}

function parseSidebarSourceCoverage(
  value: unknown,
): SidebarProperty["sourceCoverage"] {
  if (value === "gsc_only" || value === "ga4_only" || value === "linked") {
    return value;
  }

  return "linked";
}

function isSidebarPropertyCurrent(pathname: string, propertyId: string) {
  const currentId = pathname.split("/").at(-1);
  if (!currentId) return false;

  try {
    return decodeURIComponent(currentId) === propertyId;
  } catch {
    return currentId === propertyId;
  }
}

function SidebarPropertyLink({
  property,
  pathname,
  onNavigate,
}: {
  property: SidebarProperty;
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = isSidebarPropertyCurrent(pathname, property.id);
  const href = `/properties/${encodeURIComponent(property.id)}`;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
        current
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-primary"
          : "text-sidebar-foreground/86 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-bold text-white shadow-sm">
        {getSidebarPropertyInitial(property.label)}
      </span>
      <span className="min-w-0 flex-1 truncate">{property.label}</span>
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          getSidebarPropertyStatusClasses(property.sourceCoverage),
        )}
        aria-label={
          property.sourceCoverage === "linked"
            ? "Linked"
            : property.sourceCoverage === "gsc_only"
              ? "Search Console only"
              : "Analytics only"
        }
      />
    </Link>
  );
}

export function AppSidebar({
  isAdmin = false,
  onNavigate,
  onFeatureRequest,
  floating = false,
}: {
  isAdmin?: boolean;
  onNavigate?: () => void;
  onFeatureRequest?: () => void;
  floating?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [meta, setMeta] = useState<SidebarMeta | null>(null);
  const themeOptions = getAppSidebarFooterThemeOptions();
  const model = getAppSidebarModel({
    pathname,
    isAdmin,
    tab: searchParams.get("tab"),
    view: searchParams.get("view"),
  });

  useEffect(() => {
    Promise.all([
      requestJson<Record<string, unknown>>("/api/settings").catch(
        () => ({}) as Record<string, unknown>,
      ),
      requestJson<Record<string, unknown>>("/api/properties").catch(
        () => ({}) as Record<string, unknown>,
      ),
    ])
      .then(([settingsData, propertiesData]) => {
        const source = settingsData ?? {};
        const propertySource = propertiesData ?? {};
        const reportableProperties = Array.isArray(
          propertySource.reportableProperties,
        )
          ? propertySource.reportableProperties
              .filter((property): property is Record<string, unknown> =>
                Boolean(property && typeof property === "object"),
              )
              .map((property) => ({
                id: typeof property.id === "string" ? property.id : "",
                label:
                  typeof property.label === "string"
                    ? property.label
                    : typeof property.gscUrl === "string"
                      ? property.gscUrl
                      : "Website",
                gscUrl:
                  typeof property.gscUrl === "string"
                    ? property.gscUrl
                    : null,
                sourceCoverage: parseSidebarSourceCoverage(
                  property.sourceCoverage,
                ),
              }))
              .filter((property) => property.id.length > 0)
          : [];

        setMeta({
          teamTier:
            typeof source.teamTier === "string" ? source.teamTier : "free",
          reportsThisMonth:
            typeof source.reportsThisMonth === "number"
              ? source.reportsThisMonth
              : 0,
          reportsLimit:
            typeof source.reportsLimit === "number"
              ? source.reportsLimit
              : null,
          detailsThisMonth:
            typeof source.detailsThisMonth === "number"
              ? source.detailsThisMonth
              : 0,
          detailsLimit:
            typeof source.detailsLimit === "number"
              ? source.detailsLimit
              : null,
          reportableProperties,
        });
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    onNavigate?.();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <nav
      className={cn(
        "flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
        floating &&
          "rounded-lg border border-sidebar-border/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_2px_rgba(2,6,23,0.16),0_18px_40px_rgba(2,6,23,0.38)]",
      )}
    >
      <div className="border-b border-sidebar-border/80 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60"
          onClick={onNavigate}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/15">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-white/90"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold tracking-tight">
              Webhealth
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <section className="space-y-1">
            {model.primaryItems.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                onNavigate={onNavigate}
                onFeatureRequest={onFeatureRequest}
                badge={
                  item.id === "properties"
                    ? meta?.reportableProperties.length
                    : item.id === "reports"
                      ? meta?.reportsThisMonth
                      : undefined
                }
              />
            ))}
          </section>

          {meta?.reportableProperties.length ? (
            <section className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
                Your Properties
              </p>
              <div className="space-y-1">
                {meta.reportableProperties.map((property) => (
                  <SidebarPropertyLink
                    key={property.id}
                    property={property}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {model.adminItems.length > 0 ? (
            <section className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
                Admin
              </p>
              <div className="space-y-1">
                {model.adminItems.map((item) => (
                  <SidebarLink
                    key={item.id}
                    item={item}
                    onNavigate={onNavigate}
                    onFeatureRequest={onFeatureRequest}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
              Help
            </p>

            <Collapsible
              key={
                model.supportGroup.current
                  ? "support-current"
                  : "support-default"
              }
              defaultOpen={model.supportGroup.current}
            >
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/78 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 focus-visible:outline-none">
                  <CircleHelp className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                  <span className="flex-1 truncate">
                    {model.supportGroup.label}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/55 transition-transform data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1 border-l border-sidebar-border/70 pl-4 ml-5">
                {model.supportGroup.items.map((item) => (
                  <SidebarLink
                    key={item.id}
                    item={item}
                    onNavigate={onNavigate}
                    onFeatureRequest={onFeatureRequest}
                    nested
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </section>
        </div>
      </div>

      <div className="border-t border-sidebar-border/80 p-4">
        <div className="space-y-3">
          {meta ? (
            <UsageCard
              reportsThisMonth={meta.reportsThisMonth}
              reportsLimit={meta.reportsLimit}
              detailsThisMonth={meta.detailsThisMonth}
              detailsLimit={meta.detailsLimit}
              variant="compact"
            />
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/75 focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 focus-visible:outline-none">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage
                    src={session?.user?.image ?? ""}
                    alt={session?.user?.name ?? "User"}
                  />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                    {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {session?.user?.name ?? "Account"}
                  </span>
                  <span className="block truncate text-xs text-sidebar-foreground/58">
                    {session?.user?.email ?? ""}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-sidebar-foreground/45" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0 rounded-lg"
            >
              <DropdownMenuLabel className="space-y-2 p-3 font-normal">
                <div className="space-y-0.5">
                  <p className="truncate text-sm font-semibold">
                    {session?.user?.name ?? "Account"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session?.user?.email ?? ""}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {formatPlanName(meta?.teamTier)}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" onClick={onNavigate}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings?tab=contact" onClick={onNavigate}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact &amp; Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <div className="overflow-hidden rounded-lg border border-border/70">
                {themeOptions.map((option, index) => {
                  const Icon =
                    option.value === "system"
                      ? Monitor
                      : option.value === "light"
                        ? Sun
                        : Moon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={getAppSidebarThemeChoiceClasses({
                        active: theme === option.value,
                        first: index === 0,
                        last: index === themeOptions.length - 1,
                      })}
                      onClick={() => setTheme(option.value)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
