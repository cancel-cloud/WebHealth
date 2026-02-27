"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Dashboard", href: "/dashboard" },
];

// On variant pages (/1, /2 … /N), anchor links should be same-page
function useNavLinks() {
  const pathname = usePathname();
  const isVariant = /^\/\d+$/.test(pathname);
  if (!isVariant) return NAV_LINKS;
  return NAV_LINKS.map((l) =>
    l.href.startsWith("/#") ? { ...l, href: l.href.slice(1) } : l
  );
}

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const isApp = pathname.startsWith("/dashboard") || pathname.startsWith("/reports");
  const navLinks = useNavLinks();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => { window.location.href = "/"; },
      },
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-primary/10 backdrop-blur-md">
      <div className={`flex items-center justify-between h-16 ${isApp ? 'container mx-auto px-4' : 'px-6 max-w-7xl mx-auto'}`}>
        {/* Logo */}
        <Link href="/" className="font-extrabold text-xl tracking-tighter flex items-center gap-2 font-display">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
          </div>
          WebAudit
        </Link>

        {/* Marketing nav links (only on public pages) */}
        {!isApp && (
          <div className="hidden md:flex items-center gap-6">
            {navLinks.filter((l) => l.href !== "/dashboard").map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse bg-muted rounded-full" />
          ) : session ? (
            <div className="flex items-center gap-3">
              {!isApp && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden md:flex gap-1.5 rounded-full">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-border hover:ring-primary/50 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image!} alt={session.user.name} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={handleSignIn} className="rounded-full px-5 shadow-sm shadow-primary/20">
              Sign in with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
