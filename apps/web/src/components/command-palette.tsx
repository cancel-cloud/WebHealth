"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@webhealth/shared/lib/utils";
import {
  LayoutDashboard, FileText, Globe, Settings,
  Plus, RefreshCw, Sun, Moon, Monitor, LogOut,
  Users, ScrollText, Flag,
  SlidersHorizontal, Bot, Bug,
  MessageSquare,
  Sparkles,
  Palette,
} from "lucide-react";

const GH = "[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium";

function CmdItem({ onSelect, icon: Icon, label, className }: {
  onSelect: () => void;
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm select-none outline-none",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        className
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span>{label}</span>
    </Command.Item>
  );
}

export function CommandPalette({
  isAdmin = false,
  onFeatureRequest,
}: {
  isAdmin?: boolean;
  onFeatureRequest?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setTheme } = useTheme();

  // Only wire ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 0);
  }, []);

  const signOut = async () => {
    setOpen(false);
    await authClient.signOut({
      fetchOptions: { onSuccess: () => { window.location.href = "/"; } },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 overflow-hidden max-w-lg rounded-lg gap-0"
        showCloseButton={false}
        aria-label="Command palette"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="w-full">
          <Command.Input
            ref={inputRef}
            placeholder="Type a command or search…"
            className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className={GH}>
              <CmdItem onSelect={() => run(() => router.push("/dashboard"))} icon={LayoutDashboard} label="Go to Dashboard" />
              <CmdItem onSelect={() => run(() => router.push("/reports"))} icon={FileText} label="Go to Reports" />
              <CmdItem onSelect={() => run(() => router.push("/properties"))} icon={Globe} label="Go to Properties" />
              <CmdItem onSelect={() => run(() => router.push("/settings"))} icon={Settings} label="Go to Settings" />
              <CmdItem onSelect={() => run(() => router.push("/settings/branding"))} icon={Palette} label="Go to Branding" />
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border" />

            <Command.Group heading="Actions" className={GH}>
              <CmdItem onSelect={() => run(() => router.push("/reports"))} icon={Plus} label="New Report" />
              <CmdItem onSelect={() => run(() => router.push("/properties"))} icon={RefreshCw} label="Sync Properties" />
              <CmdItem onSelect={() => run(() => router.push("/settings?tab=contact"))} icon={MessageSquare} label="Contact Support" />
              <CmdItem onSelect={() => run(() => onFeatureRequest?.())} icon={Sparkles} label="Feature Requests" />
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border" />

            <Command.Group heading="Appearance" className={GH}>
              <CmdItem onSelect={() => run(() => setTheme("light"))} icon={Sun} label="Light Mode" />
              <CmdItem onSelect={() => run(() => setTheme("dark"))} icon={Moon} label="Dark Mode" />
              <CmdItem onSelect={() => run(() => setTheme("system"))} icon={Monitor} label="System Mode" />
            </Command.Group>

            {isAdmin && (
              <>
                <Command.Separator className="my-1 h-px bg-border" />
                <Command.Group heading="Admin" className={GH}>
                  <CmdItem onSelect={() => run(() => router.push("/admin/users"))} icon={Users} label="User Management" />
                  <CmdItem onSelect={() => run(() => router.push("/admin/logs"))} icon={ScrollText} label="System Logs" />
                  <CmdItem onSelect={() => run(() => router.push("/admin/feature-flags"))} icon={Flag} label="Feature Flags" />
                  <CmdItem onSelect={() => run(() => router.push("/admin/global-settings"))} icon={SlidersHorizontal} label="Global Settings" />
                  <CmdItem onSelect={() => run(() => router.push("/admin/ai-report-settings"))} icon={Bot} label="AI Report Settings" />
                  <CmdItem onSelect={() => run(() => router.push("/admin/ai-report-debug"))} icon={Bug} label="AI Debug Console" />
                </Command.Group>
              </>
            )}

            <Command.Separator className="my-1 h-px bg-border" />

            <Command.Group heading="Account" className={GH}>
              <CmdItem onSelect={signOut} icon={LogOut} label="Sign Out" className="text-destructive [&_svg]:text-destructive" />
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
