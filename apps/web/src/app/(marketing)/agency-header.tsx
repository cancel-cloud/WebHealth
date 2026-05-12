"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AGENCY_HOME_COPY, AGENCY_PILOT } from "./agency-homepage.content";
import {
  getLocalizedValue,
  type AgencyLandingLanguage,
} from "./agency-homepage.logic";
import {
  getAgencyDemoPath,
  getAgencyHomePath,
  getAgencyPricingPath,
} from "./agency-seo.logic";

const NAV_ITEMS = [
  { id: "demo", key: "demo" },
  { id: "pricing", key: "pricing" },
  { id: "faq", key: "faq" },
] as const;

function getSectionHref({
  id,
  language,
  samePageAnchors,
}: {
  id: string;
  language: AgencyLandingLanguage;
  samePageAnchors: boolean;
}) {
  if (id === "demo") return getAgencyDemoPath(language);
  return samePageAnchors ? `#${id}` : `${getAgencyHomePath(language)}#${id}`;
}

export function AgencyHeader({
  language,
  samePageAnchors = false,
  languageSwitcherPage = "home",
}: {
  language: AgencyLandingLanguage;
  samePageAnchors?: boolean;
  languageSwitcherPage?: "home" | "pricing" | "demo";
}) {
  const { data: session, isPending } = authClient.useSession();

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-primary/10 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href={getAgencyHomePath(language)}
          className="flex min-w-0 items-center gap-2 font-display text-lg font-extrabold tracking-tight sm:text-xl"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/20">
            <span className="size-2.5 rounded-full bg-white" />
          </span>
          <span className="min-w-0 truncate">
            Webhealth{" "}
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {getLocalizedValue(AGENCY_HOME_COPY.brandSuffix, language)}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-5 lg:flex"
          aria-label="Agency landing navigation"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={getSectionHref({
                id: item.id,
                language,
                samePageAnchors,
              })}
              className={`text-sm transition-colors hover:text-foreground ${
                item.id === "demo"
                  ? "font-semibold text-primary hover:text-primary/80"
                  : "text-muted-foreground"
              }`}
            >
              {getLocalizedValue(AGENCY_HOME_COPY.nav[item.key], language)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className="inline-flex rounded-full border border-border bg-card/75 p-1"
            role="group"
            aria-label="Language toggle"
          >
            {(["en", "de"] as const).map((nextLanguage) => (
              <Link
                key={nextLanguage}
                href={
                  languageSwitcherPage === "pricing"
                    ? getAgencyPricingPath(nextLanguage)
                    : languageSwitcherPage === "demo"
                      ? getAgencyDemoPath(nextLanguage)
                    : getAgencyHomePath(nextLanguage)
                }
                hrefLang={nextLanguage}
                className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors sm:px-3 ${
                  nextLanguage === language
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {nextLanguage.toUpperCase()}
              </Link>
            ))}
          </div>

          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/dashboard">
                {getLocalizedValue(AGENCY_HOME_COPY.nav.dashboard, language)}
              </Link>
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className="hidden rounded-full px-3 sm:inline-flex"
                onClick={handleGoogleSignIn}
              >
                <LogIn className="size-4" aria-hidden="true" />
                {getLocalizedValue(AGENCY_HOME_COPY.nav.selfServeCta, language)}
              </Button>
              <Button
                asChild
                className="rounded-full px-3 shadow-sm shadow-primary/20 sm:px-5"
                aria-label={getLocalizedValue(AGENCY_HOME_COPY.nav.pilotCta, language)}
              >
                <a href={AGENCY_PILOT.bookingUrl}>
                  <span className="sm:hidden">
                    {language === "de" ? "Pilot-Check" : "Pilot check"}
                  </span>
                  <span className="hidden sm:inline">
                    {getLocalizedValue(AGENCY_HOME_COPY.nav.pilotCta, language)}
                  </span>
                </a>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
