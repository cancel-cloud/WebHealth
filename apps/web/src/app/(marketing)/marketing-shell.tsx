"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { LegalFooterLinks } from "./legal/legal-footer-links";
import {
  buildLegalHref,
  LEGAL_DOCUMENT_IDS,
  LEGAL_NAV_LABELS,
} from "./legal/legal-routes";
import { shouldUseStandaloneAgencyChrome } from "./marketing-shell.logic";

function LegalFooterLinksFallback() {
  return LEGAL_DOCUMENT_IDS.map((documentId) => (
    <Link
      key={documentId}
      href={buildLegalHref(documentId, "en")}
      className="text-xs transition-colors hover:underline"
      style={{ color: "oklch(0.55 0.02 250)" }}
    >
      {LEGAL_NAV_LABELS.en[documentId]}
    </Link>
  ));
}

function MarketingFooter() {
  const nickLaunchesHref =
    "https://nicklaunches.com/products/webhealth-seo-backlog/?utm_source=webhealth.devbrew.dev&utm_medium=badge&utm_campaign=featured";

  return (
    <footer
      className="border-t py-8 px-6"
      style={{
        borderColor: "oklch(0.91 0.01 250)",
        backgroundColor: "oklch(0.975 0.003 250)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span
              className="font-display font-bold text-sm"
              style={{ color: "oklch(0.12 0.01 250)" }}
            >
              Webhealth
            </span>
            <span className="text-xs" style={{ color: "oklch(0.62 0.02 250)" }}>
              &copy; {new Date().getFullYear()} DevBrew. All rights reserved.
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-5" aria-label="Footer navigation">
            <Link
              href="/about"
              className="text-xs transition-colors hover:underline"
              style={{ color: "oklch(0.55 0.02 250)" }}
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-xs transition-colors hover:underline"
              style={{ color: "oklch(0.55 0.02 250)" }}
            >
              Pricing
            </Link>
            <Suspense fallback={<LegalFooterLinksFallback />}>
              <LegalFooterLinks />
            </Suspense>
            <CookieSettingsButton />
            <a
              href="mailto:kontakt@devbrew.dev"
              className="text-xs hover:underline transition-colors"
              style={{ color: "oklch(0.55 0.02 250)" }}
            >
              Contact
            </a>
          </nav>
        </div>
        <a
          href={nickLaunchesHref}
          target="_blank"
          rel="noopener"
          className="self-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://nicklaunches.com/badges/featured.svg"
            alt="WebHealth SEO Backlog on Nick Launches"
            width="244"
            height="56"
            className="block dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://nicklaunches.com/badges/featured-dark.svg"
            alt="WebHealth SEO Backlog on Nick Launches"
            width="244"
            height="56"
            className="hidden dark:block"
          />
        </a>
      </div>
    </footer>
  );
}

export function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (shouldUseStandaloneAgencyChrome(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <MarketingFooter />
    </>
  );
}
