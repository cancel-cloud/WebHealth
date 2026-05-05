import type { Metadata } from "next";
import { getLegalDocument } from "./legal-content";
import { LEGAL_DOCUMENT_PATHS, LEGAL_LANGUAGE_LABELS } from "./legal-routes";

export {
  buildLegalHref,
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_PATHS,
  LEGAL_LANGUAGE_LABELS,
  LEGAL_NAV_LABELS,
  resolveLegalLocale,
  resolveLegalNavLocale,
} from "./legal-routes";
export type {
  LegalDocumentId,
  LegalDocumentPath,
  LegalLocale,
  LegalParamValue,
} from "./legal-routes";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev";

export function buildLegalMetadata(
  documentId: keyof typeof LEGAL_DOCUMENT_PATHS,
  locale: "en" | "de",
): Metadata {
  const document = getLegalDocument(locale, documentId);
  const path = LEGAL_DOCUMENT_PATHS[documentId];
  const tagline =
    locale === "de"
      ? "Webhealth · Webanalyse & SEO"
      : "Webhealth · Web Analytics & SEO";
  const metaTitle = `${document.title} — ${tagline}`;
  const localePath = locale === "de" ? `${path}?lang=de` : path;

  return {
    title: metaTitle,
    description: document.description,
    alternates: {
      canonical: localePath,
      languages: {
        en: path,
        de: `${path}?lang=de`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: document.description,
      url: `${BASE_URL}${localePath}`,
      images: ["/og-image.png"],
    },
    twitter: {
      title: metaTitle,
      description: document.description,
      images: ["/og-image.png"],
    },
  };
}

export function getLegalLanguageOptions(currentLocale: "en" | "de") {
  return (Object.keys(LEGAL_LANGUAGE_LABELS) as Array<"en" | "de">).map(
    (locale) => ({
      locale,
      label: LEGAL_LANGUAGE_LABELS[locale],
      current: locale === currentLocale,
    }),
  );
}
