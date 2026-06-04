import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { AgencyHeader } from "./agency-header";
import { ArticleCTA } from "./article-cta";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  CLUSTER_ARTICLES,
  HUB_COPY,
  getAgencyResourcesPath,
  getClusterArticlePath,
  getPrimaryClusterCta,
  getSecondaryClusterCta,
  type ClusterArticle,
} from "./agency-content-cluster";
import { getAgencySeoTopicPath } from "./agency-seo.logic";

function pageSwitcherHref(language: AgencyLandingLanguage) {
  return {
    de: getAgencyResourcesPath("de"),
    en: getAgencyResourcesPath("en"),
  }[language];
}

function articleSwitcherHref(language: AgencyLandingLanguage, article: ClusterArticle) {
  return {
    de: getClusterArticlePath("de", article.slug),
    en: getClusterArticlePath("en", article.slug),
  }[language];
}

export function ClusterHubPage({ language }: { language: AgencyLandingLanguage }) {
  const copy = HUB_COPY[language];
  const primary = getPrimaryClusterCta(language);
  const moneyPage = getSecondaryClusterCta(language);

  return (
    <main className="bg-background text-foreground">
      <AgencyHeader
        language={language}
        languageSwitcherHrefByLanguage={{
          de: pageSwitcherHref("de"),
          en: pageSwitcherHref("en"),
        }}
      />

      <section className="border-b border-border bg-muted/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {language === "de" ? "Wissen" : "Resources"}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold text-foreground sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {copy.intro}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={moneyPage.href}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
            >
              {moneyPage.label}
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
            <Link
              href={primary.href}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold"
            >
              {primary.label}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {copy.audienceTitle}
            </h2>
          </div>
          <p className="text-base leading-8 text-muted-foreground">
            {copy.audience}
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {copy.groups.map((group) => (
            <article key={group.title} className="border border-border bg-background p-5">
              <h2 className="font-display text-lg font-semibold">{group.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {group.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-2">
            {CLUSTER_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={getClusterArticlePath(language, article.slug)}
                className="group border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {article.category}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-foreground">
                  {article.title[language]}
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {article.description[language]}
                </p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                  {language === "de" ? "Artikel lesen" : "Read article"}
                  <ArrowRight
                    className="ml-2 size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <ArticleCTA
            language={language}
            eyebrow={language === "de" ? "WebHealth Demo" : "WebHealth demo"}
            title={copy.ctaTitle}
            description={copy.ctaBody}
            secondaryLabel={moneyPage.label}
            secondaryHref={moneyPage.href}
          />
        </div>
      </section>
    </main>
  );
}

export function ClusterArticlePage({
  language,
  article,
}: {
  language: AgencyLandingLanguage;
  article: ClusterArticle;
}) {
  const related = CLUSTER_ARTICLES.filter((item) => item.slug !== article.slug);

  return (
    <main className="bg-background text-foreground">
      <AgencyHeader
        language={language}
        languageSwitcherHrefByLanguage={{
          de: articleSwitcherHref("de", article),
          en: articleSwitcherHref("en", article),
        }}
      />

      <article>
        <header className="border-b border-border bg-muted/30 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <Link
              href={getAgencyResourcesPath(language)}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-primary"
            >
              {language === "de" ? "Wissen" : "Resources"}
            </Link>
            <h1 className="mt-4 font-display text-4xl font-semibold text-foreground sm:text-5xl">
              {article.title[language]}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {article.intro[language]}
            </p>
          </div>
        </header>

        <div className="px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-12">
            {article.sections.map((section) => (
              <section key={section.title[language]}>
                <h2 className="font-display text-2xl font-semibold">
                  {section.title[language]}
                </h2>
                <div className="mt-5 space-y-4 text-base leading-8 text-muted-foreground">
                  {section.body[language].map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            {article.comparison ? (
              <section>
                <h2 className="font-display text-2xl font-semibold">
                  {article.comparison.title[language]}
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {article.comparison.intro[language]}
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {article.comparison.items.map((item) => (
                    <article
                      key={item.title[language]}
                      className="rounded-lg border border-border bg-card p-5"
                    >
                      <h3 className="font-display text-xl font-semibold">
                        {item.title[language]}
                      </h3>
                      <p className="mt-3 text-sm font-semibold leading-6 text-primary">
                        {item.question[language]}
                      </p>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                        {item.signals[language].map((signal) => (
                          <li key={signal} className="flex gap-3">
                            <CheckCircle2
                              className="mt-0.5 size-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {article.checklist ? (
              <section>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  {language === "de" ? "Für den nächsten Call" : "For the next call"}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold">
                  {article.checklist.title[language]}
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {article.checklist.intro[language]}
                </p>
                <ol className="mt-6 space-y-4">
                  {article.checklist.stages.map((stage) => (
                    <li
                      key={stage.title[language]}
                      className="rounded-lg border border-border bg-muted/30 p-5"
                    >
                      <h3 className="font-display text-lg font-semibold">
                        {stage.title[language]}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {stage.description[language]}
                      </p>
                      <ul className="mt-4 space-y-2 text-sm leading-6">
                        {stage.items[language].map((item) => (
                          <li key={item} className="flex gap-3">
                            <CheckCircle2
                              className="mt-0.5 size-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section>
              <h2 className="font-display text-2xl font-semibold">
                {language === "de" ? "Praktischer Workflow" : "Practical workflow"}
              </h2>
              <ol className="mt-5 space-y-3">
                {article.workflow[language].map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-7">
                    <CheckCircle2
                      className="mt-1 size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold">
                {language === "de" ? "Häufige Fehler" : "Common mistakes"}
              </h2>
              <ul className="mt-5 space-y-3 text-base leading-7 text-muted-foreground">
                {article.mistakes[language].map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>

            <section className="border border-border bg-muted/30 p-6">
              <h2 className="font-display text-2xl font-semibold">WebHealth</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                {article.webhealth[language]}
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {language === "de"
                  ? "WebHealth ersetzt Ahrefs, Semrush, Screaming Frog, Looker Studio, GA4 oder GSC nicht."
                  : "WebHealth does not replace Ahrefs, Semrush, Screaming Frog, Looker Studio, GA4, or GSC."}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold">FAQ</h2>
              <div className="mt-5 divide-y divide-border border-y border-border">
                {article.faqs.map((faq) => (
                  <div key={faq.question[language]} className="py-5">
                    <h3 className="font-semibold text-foreground">
                      {faq.question[language]}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {faq.answer[language]}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <ArticleCTA
              language={language}
              eyebrow={article.cta.eyebrow[language]}
              title={article.cta.title[language]}
              description={article.cta.description[language]}
              secondaryLabel={article.cta.secondaryLabel[language]}
              secondaryHref={article.cta.secondaryHref[language]}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold">
                {language === "de"
                  ? "Quellen und weiterführende Links"
                  : "Sources and further reading"}
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                {article.sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      className="text-primary underline-offset-4 hover:underline"
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-border pt-8">
              <h2 className="font-display text-xl font-semibold">
                {language === "de" ? "Weiterlesen" : "Read next"}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={getAgencySeoTopicPath(language)}
                  className="border border-border p-4 text-sm font-semibold hover:border-primary/50"
                >
                  {language === "de"
                    ? "SEO Reporting Tool für Agenturen"
                    : "SEO reporting software for agencies"}
                </Link>
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={getClusterArticlePath(language, item.slug)}
                    className="border border-border p-4 text-sm font-semibold hover:border-primary/50"
                  >
                    {item.title[language]}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
