"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@webhealth/shared/lib/auth-client";
import {
  normalizeSettingsResponse,
  resolveSettingsTab,
  type Settings,
} from "./settings-page.logic";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPricingBadgeClassNames } from "@/components/pricing-badge-styles";
import { useFeedbackModal } from "@/components/feedback-modal-context";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";
import { formatPlanName } from "@/lib/plan-label";
import {
  DEFAULT_AGENCY_SITE_COUNT,
  getAgencyPrice,
  getLocalizedPricingValue,
  PUBLIC_PRICING_PLANS,
} from "@/lib/pricing";
import { toast } from "sonner";
import {
  SUPPORTED_LANGUAGE_LABELS,
  type SupportedLanguage,
} from "@webhealth/shared/lib/language";
import { useAppLanguage } from "@/lib/app-language";
import {
  Sparkles,
  Bug,
  CircleAlert,
  MessageSquare,
  Shield,
  FileText,
  Info,
  Palette,
  Check,
} from "lucide-react";

const SETTINGS_PAGE_COPY = {
  en: {
    title: "Settings",
    subtitle: "Manage billing, workspace preferences, and support options for your workspace.",
    restrictedFallback: "Your account is currently restricted. Contact an administrator from the Contact Us tab for help.",
    tabs: { account: "Account", contact: "Contact Us" },
    activeUntil: "Active until",
    accountSummary: "Manage your workspace account and billing details.",
    languageTitle: "Language",
    languageDescription: "Controls the app and future client snapshots.",
    languageAria: "Application language",
    languageSaved: "Language saved",
    languageErrorTitle: "Language update failed",
    tryAgain: "Please try again.",
    billingPortalError: "Billing portal error",
    failedBillingPortal: "Failed to open billing portal",
    planCurrent: "Current Plan",
    planAlreadyCurrent: "Plan already up to date",
    planNoCustomer: "No Stripe billing profile exists yet, so your workspace remains on Solo.",
    planRefreshed: "Plan refreshed",
    activePlan: "Active plan",
    syncFailed: "Sync failed",
    deletionFailed: "Deletion failed",
    contactSupport: "Please contact support.",
    brandingEyebrow: "Agency branding",
    brandingTitle: "Manage export branding in one place",
    brandingDescription: "Agency name, contact details, logo, icon, and export colors now live on a dedicated page instead of being hidden inside snapshot payloads.",
    brandingAction: "Open Branding Page",
    planTitle: "Choose Your Plan",
    planDescription: "Review the same public pricing shown on the landing page, then manage billing, cancellation, and invoices from Stripe.",
    syncPlanTitle: "Sync your plan status from Stripe",
    refreshPlan: "Refresh Plan",
    refreshing: "Refreshing...",
    billingPortalTitle: "Open Stripe billing portal",
    billingPortalDisabledTitle: "Billing portal is available after a Stripe checkout creates a billing profile",
    manageBilling: "Manage Billing, Cancellation & Invoices",
    cancelNoticeSuffix: "then it reverts to Solo Plan.",
    checkoutMissing: "Stripe checkout URL missing",
    checkoutFailed: "Checkout failed",
    billingPreferences: "Billing Preferences",
    receipts: "Receipts",
    receiptsTooltip: "Stripe sends receipts automatically to your account email. If you didn't receive one, click Manage Billing & Invoices above to view them in the billing portal.",
    dangerZone: "Danger Zone",
    dangerDescription: "Permanently delete your account and all associated data.",
    deleteAccount: "Delete Account",
    deleteTitle: "Delete your account?",
    deleteDescription: "This action is permanent and irreversible. All your properties, snapshots, and data will be deleted.",
    cancel: "Cancel",
    confirmDelete: "Yes, delete my account",
    contactTitle: "We're here to help",
    contactDescription: "Reach out through any of the channels below.",
    contactCards: {
      feature: ["Have a cool feature idea?", "Share your idea directly with us from inside the app."],
      bug: ["Found a non-critical bug?", "UI glitches or formatting issues? Send a bug report here."],
      billing: ["Having account or billing issues?", "Email us for priority support"],
      discussions: ["Have a question or idea?", "Join the conversation on GitHub Discussions"],
      privacy: ["Privacy Policy", "Read our privacy policy and data handling practices"],
      terms: ["Terms of Service", "Review our terms of service and usage guidelines"],
      impressum: ["Impressum", "View the legal notice and provider identification details"],
    },
  },
  de: {
    title: "Einstellungen",
    subtitle: "Verwalte Abrechnung, Arbeitsbereich, Präferenzen und Support-Optionen für deinen Arbeitsbereich.",
    restrictedFallback: "Dein Konto ist derzeit eingeschränkt. Kontaktiere über den Tab Kontakt einen Administrator.",
    tabs: { account: "Konto", contact: "Kontakt" },
    activeUntil: "Aktiv bis",
    accountSummary: "Verwalte dein Arbeitsbereichskonto und deine Abrechnungsdaten.",
    languageTitle: "Sprache",
    languageDescription: "Steuert die App und zukünftige Kunden-Snapshots.",
    languageAria: "Anwendungssprache",
    languageSaved: "Sprache gespeichert",
    languageErrorTitle: "Sprache konnte nicht gespeichert werden",
    tryAgain: "Bitte versuche es erneut.",
    billingPortalError: "Fehler im Abrechnungsportal",
    failedBillingPortal: "Abrechnungsportal konnte nicht geöffnet werden",
    planCurrent: "Aktueller Plan",
    planAlreadyCurrent: "Plan ist bereits aktuell",
    planNoCustomer: "Es gibt noch kein Stripe-Abrechnungsprofil, daher bleibt dein Arbeitsbereich im Solo-Plan.",
    planRefreshed: "Plan aktualisiert",
    activePlan: "Aktiver Plan",
    syncFailed: "Synchronisierung fehlgeschlagen",
    deletionFailed: "Löschen fehlgeschlagen",
    contactSupport: "Bitte kontaktiere den Support.",
    brandingEyebrow: "Agentur-Branding",
    brandingTitle: "Export-Branding an einem Ort verwalten",
    brandingDescription: "Agenturname, Kontaktdaten, Logo, Icon und Exportfarben liegen jetzt auf einer eigenen Seite statt versteckt in Snapshot-Payloads.",
    brandingAction: "Branding-Seite öffnen",
    planTitle: "Plan auswählen",
    planDescription: "Prüfe die gleichen öffentlichen Preise wie auf der Landingpage und verwalte Abrechnung, Kündigung und Rechnungen anschließend in Stripe.",
    syncPlanTitle: "Planstatus aus Stripe synchronisieren",
    refreshPlan: "Plan aktualisieren",
    refreshing: "Aktualisiert...",
    billingPortalTitle: "Stripe-Abrechnungsportal öffnen",
    billingPortalDisabledTitle: "Das Abrechnungsportal ist verfügbar, nachdem ein Stripe-Checkout ein Abrechnungsprofil angelegt hat",
    manageBilling: "Abrechnung, Kündigung & Rechnungen verwalten",
    cancelNoticeSuffix: "danach fällt er auf den Solo-Plan zurück.",
    checkoutMissing: "Stripe-Checkout-URL fehlt",
    checkoutFailed: "Checkout fehlgeschlagen",
    billingPreferences: "Abrechnungseinstellungen",
    receipts: "Belege",
    receiptsTooltip: "Stripe sendet Belege automatisch an die E-Mail-Adresse deines Kontos. Falls kein Beleg angekommen ist, öffne oben Abrechnung & Rechnungen verwalten, um sie im Abrechnungsportal anzusehen.",
    dangerZone: "Gefahrenbereich",
    dangerDescription: "Lösche dein Konto und alle zugehörigen Daten dauerhaft.",
    deleteAccount: "Konto löschen",
    deleteTitle: "Konto löschen?",
    deleteDescription: "Diese Aktion ist dauerhaft und kann nicht rückgängig gemacht werden. Alle deine Properties, Snapshots und Daten werden gelöscht.",
    cancel: "Abbrechen",
    confirmDelete: "Ja, mein Konto löschen",
    contactTitle: "Wir helfen dir weiter",
    contactDescription: "Melde dich über einen der folgenden Kanäle.",
    contactCards: {
      feature: ["Gute Feature-Idee?", "Teile deine Idee direkt aus der App mit uns."],
      bug: ["Nicht-kritischen Fehler gefunden?", "UI-Fehler oder Formatierungsprobleme? Sende hier einen Bug-Report."],
      billing: ["Probleme mit Konto oder Abrechnung?", "Schreibe uns für priorisierten Support"],
      discussions: ["Frage oder Idee?", "Diskutiere mit uns in GitHub Discussions"],
      privacy: ["Datenschutzerklärung", "Lies unsere Datenschutzerklärung und Datenverarbeitungspraxis"],
      terms: ["Nutzungsbedingungen", "Prüfe unsere Nutzungsbedingungen und Richtlinien"],
      impressum: ["Impressum", "Rechtliche Angaben und Anbieterkennzeichnung ansehen"],
    },
  },
} as const;

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const { openFeedback } = useFeedbackModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = useAppLanguage();
  const copy = SETTINGS_PAGE_COPY[language];
  const activeTab = resolveSettingsTab(searchParams.get("tab"));

  const [settings, setSettings] = useState<Settings | null>(null);
  const [isPlanSyncing, setIsPlanSyncing] = useState(false);
  const [isLanguageSaving, setIsLanguageSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const data = await requestJson<Record<string, unknown>>("/api/settings");
    setSettings(normalizeSettingsResponse(data));
  }, []);

  useEffect(() => {
    // Skip initial fetch when the Stripe redirect effect will handle it
    const stripeParam = searchParams.get("stripe");
    if (stripeParam !== "success" && stripeParam !== "portal") {
      fetchSettings();
    }
  }, [fetchSettings, searchParams]);

  useEffect(() => {
    if (
      searchParams.get("stripe") === "success" ||
      searchParams.get("stripe") === "portal"
    ) {
      requestJson("/api/stripe/sync-plan", { method: "POST" })
        .then(() => fetchSettings())
        .catch(() => fetchSettings())
        .finally(() => {
          router.refresh();
          router.replace("/settings");
        });
    }
  }, [fetchSettings, router, searchParams]);

  const handleBillingPortal = async () => {
    try {
      const data = await requestJson<{ url?: string }>("/api/stripe/portal", {
        method: "POST",
      });
      if (!data?.url) throw new Error(copy.failedBillingPortal);
      window.location.href = data.url;
    } catch (error) {
      toast.error(copy.billingPortalError, {
        description: getAppErrorMessage(error, copy.tryAgain),
      });
    }
  };

  const handleSyncPlan = async () => {
    setIsPlanSyncing(true);

    try {
      const data = await requestJson<{
        synced?: boolean;
        tier?: string;
        reason?: string;
      }>("/api/stripe/sync-plan", { method: "POST" });
      await fetchSettings();
      router.refresh();

      if (data?.reason === "no_customer") {
        toast.info(copy.planAlreadyCurrent, {
          description: copy.planNoCustomer,
        });
        return;
      }

      toast.success(copy.planRefreshed, {
        description: `${copy.activePlan}: ${formatPlanName(data?.tier ?? "free")}.`,
      });
    } catch (error) {
      toast.error(copy.syncFailed, {
        description: getAppErrorMessage(error, copy.tryAgain),
      });
    } finally {
      setIsPlanSyncing(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await requestJson("/api/account", { method: "DELETE" });
      window.location.href = "/";
    } catch (error) {
      toast.error(copy.deletionFailed, {
        description: getAppErrorMessage(error, copy.contactSupport),
      });
    }
  };

  const handleLanguageChange = async (preferredLanguage: SupportedLanguage) => {
    if (settings?.preferredLanguage === preferredLanguage) return;
    setIsLanguageSaving(true);

    try {
      const data = await requestJson<Record<string, unknown>>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage }),
      });
      setSettings((current) => normalizeSettingsResponse({ ...(current ?? {}), ...data }));
      router.refresh();
      toast.success(SETTINGS_PAGE_COPY[preferredLanguage].languageSaved);
    } catch (error) {
      toast.error(copy.languageErrorTitle, {
        description: getAppErrorMessage(error, copy.tryAgain),
      });
    } finally {
      setIsLanguageSaving(false);
    }
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
  const pricingBadgeClasses = getPricingBadgeClassNames();
  const activePlanName = formatPlanName(settings?.teamTier);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold tracking-tight font-display"
          style={{ textWrap: "balance" }}
        >
          {copy.title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {copy.subtitle}
        </p>
      </div>

      {settings?.isRestricted ? (
        <div className="rounded-lg border border-amber-300/45 bg-amber-100/70 px-5 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          {settings.restrictionMessage?.trim()
            ? settings.restrictionMessage
            : copy.restrictedFallback}
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          handleTabChange(value as "account" | "contact")
        }
        className="space-y-8"
      >
        <TabsList className="h-auto rounded-lg border border-border/70 bg-muted/35 p-1">
          <TabsTrigger value="account" className="rounded-lg px-4 py-2.5">
            {copy.tabs.account}
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg px-4 py-2.5">
            {copy.tabs.contact}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-8">
          <section className="rounded-lg border border-border/70 bg-card/80 p-6 shadow-sm">
            {settings ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  <Avatar className="size-20 rounded-lg border border-border/60">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-2xl font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <p className="truncate text-2xl font-bold font-display">
                        {name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {email}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs font-medium capitalize"
                    >
                      {activePlanName}
                    </Badge>

                    {settings.subscriptionCancelAt ? (
                      <p className="text-sm text-muted-foreground">
                        {copy.activeUntil}{" "}
                        <span className="font-medium text-foreground">
                          {new Date(
                            settings.subscriptionCancelAt,
                          ).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        .
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {copy.accountSummary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 lg:pt-1">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {copy.languageTitle}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {copy.languageDescription}
                    </p>
                  </div>
                  <Select
                    value={settings.preferredLanguage}
                    onValueChange={(value) => void handleLanguageChange(value as SupportedLanguage)}
                    disabled={isLanguageSaving}
                  >
                    <SelectTrigger aria-label={copy.languageAria}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["de", "en"] as const).map((language) => (
                        <SelectItem key={language} value={language}>
                          {SUPPORTED_LANGUAGE_LABELS[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-20 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-6 w-36 rounded-full" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
                <div className="space-y-2 lg:pt-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border/70 bg-card/80 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <Palette className="size-3.5" />
                  {copy.brandingEyebrow}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold font-display tracking-tight">
                    {copy.brandingTitle}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {copy.brandingDescription}
                  </p>
                </div>
              </div>

              <Button asChild className="rounded-full">
                <Link href="/settings/branding">{copy.brandingAction}</Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="plan-heading" className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  id="plan-heading"
                  className="text-2xl font-semibold font-display tracking-tight"
                >
                  {copy.planTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.planDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={settings === null || isPlanSyncing}
                  onClick={handleSyncPlan}
                  title={copy.syncPlanTitle}
                >
                  {isPlanSyncing ? copy.refreshing : copy.refreshPlan}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!settings?.hasStripeCustomer}
                  title={
                    settings?.hasStripeCustomer
                      ? copy.billingPortalTitle
                      : copy.billingPortalDisabledTitle
                  }
                  onClick={handleBillingPortal}
                >
                  {copy.manageBilling}
                </Button>
              </div>
            </div>

            {settings === null ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
              </div>
            ) : (
              <>
                {settings.subscriptionCancelAt ? (
                  <div className="rounded-lg border border-amber-300/45 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                    Your <span className="font-semibold">{activePlanName}</span>{" "}
                    is active until{" "}
                    <span className="font-semibold">
                      {new Date(
                        settings.subscriptionCancelAt,
                      ).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    , {copy.cancelNoticeSuffix}
                  </div>
                ) : null}

                <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {PUBLIC_PRICING_PLANS.map((plan) => {
                    const isCurrent =
                      (settings.teamTier === "free" && plan.tier === "solo") ||
                      settings.teamTier === plan.tier;
                    const price =
                      plan.tier === "agency"
                        ? `€${getAgencyPrice(DEFAULT_AGENCY_SITE_COUNT)}`
                        : getLocalizedPricingValue(plan.price, settings.preferredLanguage);

                    return (
                      <article
                        key={plan.tier}
                        className={`flex h-full flex-col rounded-lg border bg-card p-6 shadow-sm ${
                          plan.highlight
                            ? "border-primary shadow-[0_16px_50px_-28px_rgba(99,102,241,0.35)]"
                            : "border-border"
                        } ${isCurrent ? "bg-primary/5" : ""}`}
                      >
                        <div className="min-h-7">
                          {plan.badge ? (
                            <Badge
                              className={`${pricingBadgeClasses.base} ${pricingBadgeClasses.mostPopularSpacing} ${pricingBadgeClasses.mostPopular}`}
                            >
                              {getLocalizedPricingValue(plan.badge, settings.preferredLanguage)}
                            </Badge>
                          ) : isCurrent ? (
                            <Badge variant="outline" className="rounded-full">
                              {copy.planCurrent}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="mt-4 min-h-[8.5rem]">
                          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                            {getLocalizedPricingValue(plan.name, settings.preferredLanguage)}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {getLocalizedPricingValue(plan.description, settings.preferredLanguage)}
                          </p>
                        </div>

                        <div className="flex min-h-16 items-end gap-2">
                          <span className="font-display text-4xl font-bold">
                            {price}
                          </span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            {getLocalizedPricingValue(plan.period, settings.preferredLanguage)}
                          </span>
                        </div>

                        <div className="mt-3 min-h-10">
                          {plan.note ? (
                            <p className="text-xs text-muted-foreground">
                              {getLocalizedPricingValue(plan.note, settings.preferredLanguage)}
                            </p>
                          ) : null}
                        </div>

                        <ul className="mt-6 space-y-3 text-sm">
                          {plan.features.map((feature) => (
                            <li
                              key={feature.en}
                              className="flex items-start gap-3"
                            >
                              <Check
                                className="mt-0.5 size-4 shrink-0 text-primary"
                                aria-hidden="true"
                              />
                              <span>
                                {getLocalizedPricingValue(feature, settings.preferredLanguage)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-6">
                          {plan.tier === "agency" ? (
                            <Button
                              asChild
                              variant="outline"
                              className="h-10 w-full rounded-full"
                            >
                              <a href="mailto:kontakt@devbrew.dev?subject=Webhealth%20Agency%20Interest">
                                {getLocalizedPricingValue(plan.cta, settings.preferredLanguage)}
                              </a>
                            </Button>
                          ) : plan.tier === "solo" ? (
                            <Button
                              asChild
                              variant={isCurrent ? "outline" : "default"}
                              className="h-10 w-full rounded-full"
                            >
                              <Link href="/dashboard">
                                {isCurrent
                                  ? copy.planCurrent
                                  : getLocalizedPricingValue(plan.cta, settings.preferredLanguage)}
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant={isCurrent ? "outline" : "default"}
                              className="h-10 w-full rounded-full"
                              disabled={isCurrent}
                              onClick={async () => {
                                try {
                                  const data = await requestJson<{ url?: string }>("/api/stripe/checkout", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ plan: plan.tier }),
                                  });
                                  if (!data?.url) throw new Error(copy.checkoutMissing);
                                  window.location.href = data.url;
                                } catch (error) {
                                  toast.error(copy.checkoutFailed, {
                                    description: getAppErrorMessage(error, copy.tryAgain),
                                  });
                                }
                              }}
                            >
                              {isCurrent
                                ? copy.planCurrent
                                : getLocalizedPricingValue(plan.cta, settings.preferredLanguage)}
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="billing-heading" className="space-y-4">
            <h2
              id="billing-heading"
              className="text-2xl font-semibold font-display tracking-tight"
            >
              {copy.billingPreferences}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{copy.receipts}</p>
              <div className="group relative">
                <Info className="size-3.5 cursor-help text-muted-foreground" />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                  {copy.receiptsTooltip}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="danger-heading" className="space-y-4">
            <h2
              id="danger-heading"
              className="text-2xl font-semibold font-display tracking-tight text-destructive"
            >
              {copy.dangerZone}
            </h2>
            <p className="text-sm text-muted-foreground">
              {copy.dangerDescription}
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {copy.deleteAccount}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{copy.deleteTitle}</DialogTitle>
                  <DialogDescription>
                    {copy.deleteDescription}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{copy.cancel}</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    {copy.confirmDelete}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </TabsContent>

        <TabsContent value="contact">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold font-display tracking-tight">
                {copy.contactTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.contactDescription}
              </p>
            </div>

            <div className="grid gap-3">
              {[
                {
                  icon: Sparkles,
                  title: copy.contactCards.feature[0],
                  description: copy.contactCards.feature[1],
                  onClick: () =>
                    openFeedback({
                      source: "settings",
                      initialType: "feature_request",
                    }),
                },
                {
                  icon: Bug,
                  title: copy.contactCards.bug[0],
                  description: copy.contactCards.bug[1],
                  onClick: () =>
                    openFeedback({
                      source: "settings",
                      initialType: "bug_report",
                    }),
                },
                {
                  icon: CircleAlert,
                  title: copy.contactCards.billing[0],
                  description: settings?.adminContacts?.length
                    ? language === "de"
                      ? `Schreibe einem Admin für priorisierten Support — ${settings.adminContacts[0]}`
                      : `Email an admin for priority support — ${settings.adminContacts[0]}`
                    : `${copy.contactCards.billing[1]} — kontakt@devbrew.dev`,
                  href: `mailto:${settings?.adminContacts?.[0] ?? "kontakt@devbrew.dev"}`,
                },
                {
                  icon: MessageSquare,
                  title: copy.contactCards.discussions[0],
                  description: copy.contactCards.discussions[1],
                  href: "https://github.com/cancel-cloud/WebHealth/discussions",
                },
                {
                  icon: Shield,
                  title: copy.contactCards.privacy[0],
                  description: copy.contactCards.privacy[1],
                  href: "/privacy",
                },
                {
                  icon: FileText,
                  title: copy.contactCards.terms[0],
                  description: copy.contactCards.terms[1],
                  href: "/terms",
                },
                {
                  icon: FileText,
                  title: copy.contactCards.impressum[0],
                  description: copy.contactCards.impressum[1],
                  href: "/impressum",
                },
              ].map(({ icon: Icon, title, description, href, onClick }) => {
                const className =
                  "flex w-full items-start gap-4 rounded-lg border border-border bg-card p-5 text-left transition-colors hover:bg-muted/35";

                if (onClick) {
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={onClick}
                      className={className}
                    >
                      <Icon
                        className="mt-0.5 size-5 flex-shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </button>
                  );
                }

                return (
                  <a key={title} href={href} className={className}>
                    <Icon
                      className="mt-0.5 size-5 flex-shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
