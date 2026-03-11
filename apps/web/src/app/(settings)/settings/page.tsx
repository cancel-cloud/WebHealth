"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@webhealth/shared/lib/auth-client";
import {
  getSettingsAccountSummary,
  getSettingsPlanCardLayoutClassNames,
  normalizeSettingsResponse,
  resolveSettingsTab,
  type Settings,
} from "./settings-page.logic";
import { UsageCard } from "@/components/usage-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getPricingBadgeClassNames } from "@/components/pricing-badge-styles";
import { formatPlanName } from "@/lib/plan-label";
import { PRICING_PLANS } from "@/lib/pricing";
import { toast } from "sonner";
import {
  Sparkles,
  Bug,
  CircleAlert,
  MessageSquare,
  Shield,
  FileText,
  Info,
} from "lucide-react";

type ToggleSettingKey = "weeklyDigest" | "reportComplete" | "syncFailure" | "emailReceipts";

const SETTING_LABELS: Record<ToggleSettingKey, string> = {
  weeklyDigest: "Weekly digest",
  reportComplete: "Report complete",
  syncFailure: "Sync failure alerts",
  emailReceipts: "Email receipts",
};

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = resolveSettingsTab(searchParams.get("tab"));

  const [settings, setSettings] = useState<Settings | null>(null);

  const fetchSettings = useCallback(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data) => setSettings(normalizeSettingsResponse(data)));
  }, []);

  useEffect(() => {
    // Skip initial fetch when the Stripe redirect effect will handle it
    const stripeParam = searchParams.get("stripe");
    if (stripeParam !== "success" && stripeParam !== "portal") {
      fetchSettings();
    }
  }, [fetchSettings, searchParams]);

  useEffect(() => {
    if (searchParams.get("stripe") === "success" || searchParams.get("stripe") === "portal") {
      fetch("/api/stripe/sync-plan", { method: "POST" })
        .then(() => fetchSettings())
        .catch(() => fetchSettings())
        .finally(() => {
          router.refresh();
          router.replace("/settings");
        });
    }
  }, [fetchSettings, router, searchParams]);

  const updateSetting = async (key: ToggleSettingKey | "reportLanguage", value: boolean | string) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });

    if (typeof value === "boolean" && key !== "reportLanguage") {
      toast.success("Preference saved", {
        description: `${SETTING_LABELS[key]} ${value ? "enabled" : "disabled"}.`,
      });
      return;
    }

    toast.success("Preference saved", {
      description: "Report language updated.",
    });
  };

  const handleUpgrade = async (plan: "pro" | "agency") => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error("Upgrade failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleBillingPortal = async () => {
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Failed to open billing portal");
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error("Billing portal error", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleSyncPlan = async () => {
    try {
      const response = await fetch("/api/stripe/sync-plan", { method: "POST" });
      const data = (await response.json()) as { synced?: boolean; tier?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
      }
      await fetchSettings();
      router.refresh();
      toast.success("Plan refreshed", {
        description: `Active plan: ${data.tier ?? "free"}.`,
      });
    } catch (error) {
      toast.error("Sync failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    const response = await fetch("/api/account", { method: "DELETE" });
    if (response.ok) {
      window.location.href = "/";
      return;
    }

    toast.error("Deletion failed", { description: "Please contact support." });
  };

  const handleTabChange = (nextTab: "account" | "contact") => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "account") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/settings?${query}` : "/settings");
    });
  };

  const name = session?.user?.name ?? "—";
  const email = session?.user?.email ?? "—";
  const image = session?.user?.image ?? "";
  const initials = name.charAt(0).toUpperCase();
  const accountSummary = settings ? getSettingsAccountSummary(settings) : null;
  const planCardLayout = getSettingsPlanCardLayoutClassNames();
  const pricingBadgeClasses = getPricingBadgeClassNames();
  const activePlanName = formatPlanName(settings?.teamTier);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight font-display" style={{ textWrap: "balance" }}>
          Settings
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage billing, reporting preferences, and support options for your workspace.
        </p>
      </div>

      {settings?.isRestricted ? (
        <div className="rounded-lg border border-amber-300/45 bg-amber-100/70 px-5 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          {settings.restrictionMessage?.trim()
            ? settings.restrictionMessage
            : "Your account is currently restricted. Contact an administrator from the Contact Us tab for help."}
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "account" | "contact")} className="space-y-8">
        <TabsList className="h-auto rounded-lg border border-border/70 bg-muted/35 p-1">
          <TabsTrigger value="account" className="rounded-lg px-4 py-2.5">
            Account
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg px-4 py-2.5">
            Contact Us
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-8">
          <section className="rounded-lg border border-border/70 bg-card/80 p-6 shadow-sm">
            {settings ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 items-start gap-4">
                  <Avatar className="h-20 w-20 rounded-lg border border-border/60">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-2xl font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <p className="truncate text-2xl font-bold font-display">{name}</p>
                      <p className="truncate text-sm text-muted-foreground">{email}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium capitalize">
                        {accountSummary?.planLabel ?? "Solo Plan"}
                      </Badge>
                      {accountSummary?.planStatus ? (
                        <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                          {accountSummary.planStatus}
                        </span>
                      ) : null}
                    </div>

                    {settings.subscriptionCancelAt ? (
                      <p className="text-sm text-muted-foreground">
                        Active until{" "}
                        <span className="font-medium text-foreground">
                          {new Date(settings.subscriptionCancelAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        .
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Your current plan and usage reset automatically each month.
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <UsageCard
                    reportsThisMonth={accountSummary?.usage.reportsThisMonth ?? 0}
                    reportsLimit={accountSummary?.usage.reportsLimit ?? null}
                    detailsThisMonth={accountSummary?.usage.detailsThisMonth ?? 0}
                    detailsLimit={accountSummary?.usage.detailsLimit ?? null}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-6 w-36 rounded-full" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
                <div className="min-w-0 rounded-lg border border-border bg-card p-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="plan-heading" className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="plan-heading" className="text-2xl font-bold font-display tracking-tight">
                  Choose Your Plan
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade, refresh billing status, or manage invoices without leaving the app.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!settings?.hasStripeCustomer}
                  onClick={handleSyncPlan}
                  title="Sync your plan status from Stripe"
                >
                  Refresh Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!settings?.hasStripeCustomer}
                  onClick={handleBillingPortal}
                >
                  Manage Billing &amp; Invoices
                </Button>
              </div>
            </div>

            {settings === null ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-56 rounded-lg" />
                <Skeleton className="h-56 rounded-lg" />
                <Skeleton className="h-56 rounded-lg" />
              </div>
            ) : (
              <>
                {settings.subscriptionCancelAt ? (
                  <div className="rounded-lg border border-amber-300/45 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                    Your <span className="font-semibold">{activePlanName}</span> is active until{" "}
                    <span className="font-semibold">
                      {new Date(settings.subscriptionCancelAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    , then it reverts to Solo Plan.
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div
                    className={`${planCardLayout.card} ${
                      settings.teamTier === "free"
                        ? "border-primary/35 bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className={planCardLayout.content}>
                      <div>
                        <p className="font-semibold font-display text-lg">{PRICING_PLANS.solo.name}</p>
                        <p className="text-3xl font-bold font-display">{PRICING_PLANS.solo.priceLabel}</p>
                      </div>
                      <ul className="space-y-2">
                        {PRICING_PLANS.solo.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {settings.teamTier === "free" ? null : (
                        <Button size="sm" variant="outline" className={planCardLayout.action} onClick={handleBillingPortal}>
                          {settings.subscriptionCancelAt ? "Manage Cancellation" : "Downgrade"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div
                    className={`relative ${planCardLayout.card} ${planCardLayout.featuredCard} ${
                      settings.teamTier === "pro"
                        ? "border-primary/35 bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge
                        className={`${pricingBadgeClasses.base} ${pricingBadgeClasses.mostPopularSpacing} ${pricingBadgeClasses.mostPopular}`}
                      >
                        Most Popular
                      </Badge>
                    </div>
                    <div className={planCardLayout.content}>
                      <div>
                        <p className="font-semibold font-display text-lg">{PRICING_PLANS.pro.name}</p>
                        <p className="text-3xl font-bold font-display">
                          {PRICING_PLANS.pro.priceLabel}
                          <span className="text-base font-medium text-muted-foreground">/mo</span>
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {PRICING_PLANS.pro.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {settings.teamTier === "pro" ? (
                        settings.subscriptionCancelAt ? (
                          <Button size="sm" variant="outline" className={planCardLayout.action} disabled>
                            Canceling
                          </Button>
                        ) : null
                      ) : (
                        <Button size="sm" className={planCardLayout.action} onClick={() => handleUpgrade("pro")}>
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                  </div>

                  <div
                    className={`${planCardLayout.card} ${
                      settings.teamTier === "agency"
                        ? "border-primary/35 bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className={planCardLayout.content}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold font-display text-lg">Agency</p>
                          <Badge
                            className={`${pricingBadgeClasses.base} ${pricingBadgeClasses.comingSoonSpacing} ${pricingBadgeClasses.comingSoon}`}
                          >
                            Coming Soon
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          For agencies and high-volume clients. Get in touch to be first in line.
                        </p>
                      </div>
                      {settings.teamTier === "agency" ? (
                        settings.subscriptionCancelAt ? (
                          <Button size="sm" variant="outline" className={planCardLayout.action} disabled>
                            Canceling
                          </Button>
                        ) : null
                      ) : (
                        <Button size="sm" variant="outline" className={planCardLayout.action} asChild>
                          <a href="mailto:contact@devbrew.dev?subject=WebAudit%20Agency%20Interest">
                            Get in touch
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="billing-heading" className="space-y-4">
            <h2 id="billing-heading" className="text-2xl font-bold font-display tracking-tight">
              Billing Preferences
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Receipts</p>
              <div className="group relative">
                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                  Stripe sends receipts automatically to your account email. If you didn&apos;t receive one, click{" "}
                  <span className="font-medium">Manage Billing &amp; Invoices</span> above to view them in the billing portal.
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="report-language-heading" className="space-y-4">
            <h2 id="report-language-heading" className="text-2xl font-bold font-display tracking-tight">
              Report Language
            </h2>
            <p className="text-sm text-muted-foreground">
              Controls AI report and XLSX output language. Dashboard language is unchanged.
            </p>
            <div className="max-w-xs">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={settings?.reportLanguage ?? "auto"}
                onChange={(event) => updateSetting("reportLanguage", event.target.value)}
              >
                <option value="auto">Auto (from Google locale)</option>
                <option value="de">German</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="it">Italian</option>
              </select>
            </div>
          </section>

          <section aria-labelledby="danger-heading" className="space-y-4">
            <h2 id="danger-heading" className="text-2xl font-bold font-display tracking-tight text-destructive">
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>

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
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Yes, delete my account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </TabsContent>

        <TabsContent value="contact">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display tracking-tight">
                We&apos;re here to help
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reach out through any of the channels below.
              </p>
            </div>

            <div className="grid gap-3">
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
                  description: settings?.adminContacts?.length
                    ? `Email an admin for priority support — ${settings.adminContacts[0]}`
                    : "Email us for priority support — contact@devbrew.dev",
                  href: `mailto:${settings?.adminContacts?.[0] ?? "contact@devbrew.dev"}`,
                },
                {
                  icon: MessageSquare,
                  title: "Have a question or idea?",
                  description: "Join the conversation on GitHub Discussions",
                  href: "https://github.com/cancel-cloud/WebHealth/discussions",
                },
                {
                  icon: Shield,
                  title: "Privacy Policy",
                  description: "Read our privacy policy and data handling practices",
                  href: "/privacy",
                },
                {
                  icon: FileText,
                  title: "Terms of Service",
                  description: "Review our terms of service and usage guidelines",
                  href: "/terms",
                },
              ].map(({ icon: Icon, title, description, href }) => (
                <a
                  key={title}
                  href={href}
                  className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/35"
                >
                  <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
