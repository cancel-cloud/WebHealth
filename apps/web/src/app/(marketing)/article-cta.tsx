import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import { getPrimaryClusterCta } from "./agency-content-cluster";

export function ArticleCTA({
  language,
  eyebrow,
  title,
  description,
  secondaryLabel,
  secondaryHref,
}: {
  language: AgencyLandingLanguage;
  eyebrow: string;
  title: string;
  description: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  const primary = getPrimaryClusterCta(language);

  return (
    <aside className="border border-border bg-primary/5 p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={primary.href}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
        >
          {primary.label}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground"
        >
          {secondaryLabel}
        </Link>
      </div>
    </aside>
  );
}
