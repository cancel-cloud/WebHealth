import Link from "next/link";
import {
  buildLegalHref,
  getLegalLanguageOptions,
  LEGAL_DOCUMENT_IDS,
  LEGAL_NAV_LABELS,
  type LegalDocumentId,
  type LegalLocale,
} from "./legal";
import type { LegalDictionary } from "./legal-types";

type LegalDocumentPageProps = {
  documentId: LegalDocumentId;
  locale: LegalLocale;
  dictionary: LegalDictionary;
};

export function LegalDocumentPage({
  documentId,
  locale,
  dictionary,
}: LegalDocumentPageProps) {
  const document = dictionary.documents[documentId];
  const languageOptions = getLegalLanguageOptions(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <div className="mb-8 text-center">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            {document.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {document.lastUpdatedLabel}
          </p>
        </div>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-border bg-muted/25 p-3">
          <nav
            aria-label={dictionary.ui.relatedDocumentsLabel}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {LEGAL_DOCUMENT_IDS.map((id) => (
              <Link
                key={id}
                href={buildLegalHref(id, locale)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  id === documentId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {LEGAL_NAV_LABELS[locale][id]}
              </Link>
            ))}
          </nav>

          <div
            className="flex flex-wrap items-center justify-center gap-1 border-border pt-1 sm:border-l sm:pl-3 sm:pt-0"
            aria-label={dictionary.ui.languageToggleLabel}
          >
            {languageOptions.map((option) => (
              <Link
                key={option.locale}
                href={buildLegalHref(documentId, option.locale)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  option.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">
        {document.languageNotice ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {document.languageNotice}
          </div>
        ) : null}

        {document.intro.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}

        {document.sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="mb-3 font-display text-xl font-bold">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mb-3 text-muted-foreground leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
