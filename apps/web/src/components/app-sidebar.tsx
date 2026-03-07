"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  Globe,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Users,
  ScrollText,
  Flag,
  SlidersHorizontal,
  Bot,
  Bug,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Properties", href: "/properties", icon: Globe },
  { label: "Settings", href: "/settings", icon: Settings },
];

const ADMIN_ITEMS = [
  { title: "Syncing", url: "/admin/syncing", icon: RefreshCw },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "System Logs", url: "/admin/logs", icon: ScrollText },
  { title: "Feature Flags", url: "/admin/feature-flags", icon: Flag },
  { title: "Global Settings", url: "/admin/global-settings", icon: SlidersHorizontal },
  { title: "AI Report Settings", url: "/admin/ai-report-settings", icon: Bot },
  { title: "AI Debug Console", url: "/admin/ai-report-debug", icon: Bug },
];

export function AppSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => { window.location.href = "/"; },
      },
    });
  };

  const ThemeIcon = !mounted ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  return (
    <Sidebar collapsible="icon">
      {/* ── Header: logo ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="WebAudit">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500 shadow-lg shadow-primary/20 flex-shrink-0">
                  <div aria-hidden="true" className="h-3 w-3 rounded-full bg-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-extrabold text-base tracking-tighter font-display">WebAudit</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav items ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Admin section ── */}
        {isAdmin && (
          <SidebarGroup>
            <Collapsible defaultOpen={false} className="group/admin">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 transition-colors">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Admin
                  </span>
                  <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/admin:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {ADMIN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.url || pathname.startsWith(item.url + "/");
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                            <Link href={item.url}>
                              <Icon aria-hidden="true" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer: profile → theme → sign out ── */}
      <SidebarFooter>
        <SidebarMenu>

          {/* Profile — opens popup */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={session?.user?.name ?? "Profile"}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                    <AvatarImage
                      src={session?.user?.image ?? ""}
                      alt={session?.user?.name ?? "User"}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{session?.user?.name ?? ""}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.email ?? ""}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56 rounded-xl"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="font-semibold text-sm truncate">
                      {session?.user?.name ?? ""}
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                      Free
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings aria-hidden="true" className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <MessageSquare aria-hidden="true" className="mr-2 h-4 w-4" />
                  Feedback
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Theme toggle */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Theme">
                  <ThemeIcon aria-hidden="true" />
                  <span>Theme</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={4}>
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                  <Sun aria-hidden="true" className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                  <Moon aria-hidden="true" className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                  <Monitor aria-hidden="true" className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Sign out */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut aria-hidden="true" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
