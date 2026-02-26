"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Bug,
  CircleAlert,
  // MessageSquare,
  Shield,
  FileText,
} from "lucide-react";

const SHORTCUTS = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "New Report", keys: ["⌘", "N"] },
  { action: "Toggle Sidebar", keys: ["⌘", "B"] },
  { action: "Refresh Data", keys: ["⌘", "R"] },
  { action: "Go to Dashboard", keys: ["⌘", "D"] },
];

type Settings = {
  weeklyDigest: boolean;
  reportComplete: boolean;
  syncFailure: boolean;
  emailReceipts: boolean;
};

export default function SettingsPage() {
  const { data: session } = authClient.useSession();

  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  const SETTING_LABELS: Record<keyof Settings, string> = {
    weeklyDigest: "Weekly digest",
    reportComplete: "Report complete",
    syncFailure: "Sync failure alerts",
    emailReceipts: "Email receipts",
  };

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    toast.success("Preference saved", {
      description: `${SETTING_LABELS[key]} ${value ? "enabled" : "disabled"}.`,
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  // TODO[delete-account]: Account deletion — not yet implemented
  const handleDeleteAccount = () => {
    console.warn("Account deletion requested — not yet implemented.");
    toast("Account deletion is not yet implemented.", {
      description: "Contact support to delete your account.",
    });
  };

  // TODO[devices]: View Devices — no API yet
  const handleViewDevices = () => {
    toast("Coming soon", {
      description: "Device management is not yet available.",
    });
  };

  const name = session?.user?.name ?? "—";
  const email = session?.user?.email ?? "—";
  const image = session?.user?.image ?? "";
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top bar ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <aside
          aria-label="Account overview"
          className="w-72 flex-shrink-0 border-r border-border overflow-y-auto p-6 space-y-5"
        >
          {/* Profile */}
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-xl font-bold">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
            {/* TODO[plan-tier]: Plan tier hardcoded — not read from DB */}
            <Badge variant="outline" className="text-xs font-medium">
              Free Plan
            </Badge>
          </div>

          <Separator />

          {/* Usage card */}
          {/* TODO[usage]: Hardcoded 100% remaining and fake reset timer */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Usage Limit</span>
              <span className="text-xs text-muted-foreground">100% remaining</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="w-full h-2 rounded-full bg-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Resets in 23h 53m</p>
          </div>

          {/* Keyboard shortcuts card */}
          {/* TODO[kbd-shortcuts]: Hardcoded — not wired to real keybindings */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold">Keyboard Shortcuts</p>
            <div className="space-y-0.5">
              {SHORTCUTS.map(({ action, keys }) => (
                <div
                  key={action}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-xs text-muted-foreground">{action}</span>
                  <div className="flex items-center gap-0.5">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono leading-none"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-[70%] mx-auto">
            <Tabs defaultValue="account">
              <TabsList className="mb-8">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="contact">Contact Us</TabsTrigger>
              </TabsList>

              {/* ── Account Tab ── */}
              <TabsContent value="account" className="space-y-12">

                {/* Choose Your Plan */}
                <section aria-labelledby="plan-heading" className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 id="plan-heading" className="text-2xl font-bold font-display tracking-tight">
                      Choose Your Plan
                    </h2>
                    {/* TODO[billing-portal]: No Stripe portal yet */}
                    <Button variant="outline" size="sm" disabled>
                      Manage Billing &amp; Invoices
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Free */}
                    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 flex flex-col gap-4">
                      <div>
                        <p className="font-semibold font-display text-lg">Free</p>
                        <p className="text-2xl font-bold font-display">$0</p>
                      </div>
                      <ul className="space-y-1.5 flex-1">
                        {["5 properties", "10 reports/mo", "Community support"].map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    </div>

                    {/* Pro — Most Popular */}
                    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 relative pt-8">
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5 rounded-full">
                          Most Popular
                        </Badge>
                      </div>
                      <div>
                        <p className="font-semibold font-display text-lg">Pro</p>
                        <p className="text-2xl font-bold font-display">$19<span className="text-base font-medium text-muted-foreground">/mo</span></p>
                      </div>
                      <ul className="space-y-1.5 flex-1">
                        {["25 properties", "Unlimited reports", "Email support", "Advanced analytics"].map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {/* TODO[upgrade-flow]: No Stripe / payment flow yet */}
                      <Button size="sm" className="w-full" disabled>
                        Upgrade
                      </Button>
                    </div>

                    {/* Agency */}
                    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
                      <div>
                        <p className="font-semibold font-display text-lg">Agency</p>
                        <p className="text-2xl font-bold font-display">$79<span className="text-base font-medium text-muted-foreground">/mo</span></p>
                      </div>
                      <ul className="space-y-1.5 flex-1">
                        {["Unlimited properties", "Priority support", "Team members", "White-label reports"].map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {/* TODO[upgrade-flow]: No Stripe / payment flow yet */}
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        Upgrade
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Billing Preferences */}
                <section aria-labelledby="billing-heading" className="space-y-4">
                  <h2 id="billing-heading" className="text-2xl font-bold font-display tracking-tight">
                    Billing Preferences
                  </h2>
                  {/* TODO[billing-prefs]: Saved to DB — email sending not yet implemented */}
                  <div>
                    <label
                      htmlFor="email-receipts"
                      className="flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium">Email me receipts</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Send receipts to your account email when a payment succeeds.
                        </p>
                      </div>
                      <Switch
                        id="email-receipts"
                        checked={settings?.emailReceipts ?? false}
                        onCheckedChange={(value) => updateSetting("emailReceipts", value)}
                        disabled={settings === null}
                        className="flex-shrink-0 mt-0.5"
                      />
                    </label>
                  </div>
                </section>

                {/* Security Options */}
                <section aria-labelledby="security-heading" className="space-y-4">
                  <h2 id="security-heading" className="text-2xl font-bold font-display tracking-tight">
                    Security Options
                  </h2>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Devices</p>
                    <p className="text-xs text-muted-foreground">
                      Manage and sign out from other devices that are currently logged in to your account.
                    </p>
                  </div>
                  {/* TODO[devices]: No API yet — shows toast placeholder */}
                  <Button variant="outline" size="sm" onClick={handleViewDevices}>
                    View Devices
                  </Button>
                </section>

                {/* Danger Zone */}
                <section aria-labelledby="danger-heading" className="space-y-4">
                  <h2 id="danger-heading" className="text-2xl font-bold font-display tracking-tight text-destructive">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                  {/* TODO[delete-account]: No real deletion yet */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete your account?</DialogTitle>
                        <DialogDescription>
                          This action is <strong>permanent and irreversible</strong>. All your properties, reports, and data will be deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {}}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Yes, delete my account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </section>
              </TabsContent>

              {/* ── Notifications Tab ── */}
              <TabsContent value="notifications">
                <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
                  <h2 className="text-xl font-bold font-display tracking-tight">
                    Email Notifications
                  </h2>
                  {settings === null && (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  )}
                  {/* TODO[email-service]: Email delivery service not yet configured (Resend / Postmark) */}
                  {/* TODO[notification-scheduler]: Weekly digest requires a cron scheduler — not yet implemented */}
                  {[
                    {
                      key: "weeklyDigest" as const,
                      id: "weekly-digest",
                      label: "Weekly digest email",
                      description: "A summary of your properties' SEO health every week.",
                    },
                    {
                      key: "reportComplete" as const,
                      id: "report-complete",
                      label: "Report complete email",
                      description: "Notify me when an SEO report finishes processing.",
                    },
                    {
                      key: "syncFailure" as const,
                      id: "sync-failure",
                      label: "Sync failure alerts",
                      description: "Alert me when a property sync fails.",
                    },
                  ].map(({ key, id, label, description }) => (
                    <label
                      key={id}
                      htmlFor={id}
                      className="flex items-center justify-between gap-4 cursor-pointer rounded-xl p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      </div>
                      <Switch
                        id={id}
                        checked={settings?.[key] ?? false}
                        onCheckedChange={(value) => updateSetting(key, value)}
                        disabled={settings === null}
                        className="flex-shrink-0"
                      />
                    </label>
                  ))}
                </div>
              </TabsContent>

              {/* ── Contact Us Tab ── */}
              <TabsContent value="contact">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display tracking-tight">
                      We&apos;re here to help!
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reach out through any of the channels below.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        icon: Sparkles,
                        title: "Have a cool feature idea?",
                        description: "Vote on upcoming features or suggest your own",
                        href: "https://github.com/cancel-cloud/WebHealth/discussions",
                      },
                      {
                        icon: Bug,
                        title: "Found a non-critical bug?",
                        description: "UI glitches or formatting issues? Report them here :)",
                        href: "https://github.com/cancel-cloud/WebHealth/issues",
                      },
                      {
                        icon: CircleAlert,
                        title: "Having account or billing issues?",
                        description: "Email us for priority support — contact@devbrew.dev",
                        href: "mailto:contact@devbrew.dev",
                      },
                      // {
                      //   icon: MessageSquare,
                      //   title: "Want to join the community?",
                      //   description: "Come hang out on our Discord!",
                      //   href: "#",
                      // },
                      {
                        icon: Shield,
                        title: "Privacy Policy",
                        description: "Read our privacy policy and data handling practices",
                        href: "#",
                      },
                      {
                        icon: FileText,
                        title: "Terms of Service",
                        description: "Review our terms of service and usage guidelines",
                        href: "#",
                      },
                    ].map(({ icon: Icon, title, description, href }) => (
                      <a
                        key={title}
                        href={href}
                        className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <Icon aria-hidden="true" className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
