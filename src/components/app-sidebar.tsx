"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, FileText, Globe, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Properties", href: "/properties", icon: Globe },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => { window.location.href = "/"; },
      },
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                  <div aria-hidden="true" className="h-3 w-3 rounded-full bg-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tighter font-outfit">WebAudit</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link href={item.href} aria-label={item.label}>
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate">{session?.user?.name ?? ""}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email ?? ""}</p>
              </div>
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring flex-shrink-0"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
