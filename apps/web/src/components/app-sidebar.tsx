"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

type SidebarMeta = {
  teamTier: string;
  reportsThisMonth: number;
  reportsLimit: number | null;
  detailsThisMonth: number;
  detailsLimit: number | null;
};

const ICONS: Record<AppSidebarIconKey, React.ComponentType<{ className?: string }>> = {
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
  nested = false,
}: {
  item: AppSidebarItem;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const Icon = ICONS[item.icon];
  const stateClasses = getAppSidebarItemClasses({ current: item.current, nested });
  const className = cn(
    "group flex w-full items-center gap-3 rounded-lg text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
    nested ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm font-medium",
    stateClasses.link
  );

  const content = (
    <>
      <Icon
        className={cn(
          "shrink-0",
          nested ? "h-4 w-4" : "h-4 w-4",
          stateClasses.icon
        )}
      />
      <span className="truncate">{item.label}</span>
    </>
  );

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

export function AppSidebar({
  isAdmin = false,
  onNavigate,
  floating = false,
}: {
  isAdmin?: boolean;
  onNavigate?: () => void;
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
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data) => {
        setMeta({
          teamTier: typeof data?.teamTier === "string" ? data.teamTier : "free",
          reportsThisMonth: typeof data?.reportsThisMonth === "number" ? data.reportsThisMonth : 0,
          reportsLimit: typeof data?.reportsLimit === "number" ? data.reportsLimit : null,
          detailsThisMonth: typeof data?.detailsThisMonth === "number" ? data.detailsThisMonth : 0,
          detailsLimit: typeof data?.detailsLimit === "number" ? data.detailsLimit : null,
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
          "rounded-lg border border-sidebar-border/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_2px_rgba(2,6,23,0.16),0_18px_40px_rgba(2,6,23,0.38)]"
      )}
    >
      <div className="border-b border-sidebar-border/80 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60"
          onClick={onNavigate}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/15">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-white/90" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold tracking-tight">WebAudit</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <section className="space-y-1">
            {model.primaryItems.map((item) => (
              <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </section>

          {model.adminItems.length > 0 ? (
            <section className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
                Admin
              </p>
              <div className="space-y-1">
                {model.adminItems.map((item) => (
                  <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
              Help
            </p>

            <Collapsible
              key={model.supportGroup.current ? "support-current" : "support-default"}
              defaultOpen={model.supportGroup.current}
            >
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/78 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 focus-visible:outline-none">
                  <CircleHelp className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                  <span className="flex-1 truncate">{model.supportGroup.label}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/55 transition-transform data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1 border-l border-sidebar-border/70 pl-4 ml-5">
                {model.supportGroup.items.map((item) => (
                  <SidebarLink key={item.href} item={item} onNavigate={onNavigate} nested />
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
                  <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
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
                  <p className="truncate text-sm font-semibold">{session?.user?.name ?? "Account"}</p>
                  <p className="truncate text-xs text-muted-foreground">{session?.user?.email ?? ""}</p>
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
                    option.value === "system" ? Monitor : option.value === "light" ? Sun : Moon;

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
