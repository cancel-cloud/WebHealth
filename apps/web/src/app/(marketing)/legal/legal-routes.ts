export const LEGAL_LOCALES = ["en", "de"] as const;

export type LegalLocale = (typeof LEGAL_LOCALES)[number];
export type LegalParamValue = string | string[] | null | undefined;

export const LEGAL_DOCUMENT_PATHS = {
  privacy: "/privacy",
  terms: "/terms",
  impressum: "/impressum",
} as const;

export type LegalDocumentId = keyof typeof LEGAL_DOCUMENT_PATHS;
export type LegalDocumentPath = (typeof LEGAL_DOCUMENT_PATHS)[LegalDocumentId];

export const LEGAL_DOCUMENT_IDS = Object.keys(
  LEGAL_DOCUMENT_PATHS,
) as LegalDocumentId[];

export const LEGAL_NAV_LABELS: Record<
  LegalLocale,
  Record<LegalDocumentId, string>
> = {
  en: {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    impressum: "Impressum",
  },
  de: {
    privacy: "Datenschutzhinweise",
    terms: "Nutzungsbedingungen",
    impressum: "Impressum",
  },
};

export const LEGAL_LANGUAGE_LABELS: Record<LegalLocale, string> = {
  en: "English",
  de: "Deutsch",
};

export function hasLegalLocale(value: string): value is LegalLocale {
  return (LEGAL_LOCALES as readonly string[]).includes(value);
}

export function resolveLegalLocale(value: LegalParamValue): LegalLocale {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && hasLegalLocale(candidate)) return candidate;
  return "en";
}

export function isLegalPathname(
  pathname: string | null | undefined,
): pathname is LegalDocumentPath {
  return (Object.values(LEGAL_DOCUMENT_PATHS) as readonly string[]).includes(
    pathname ?? "",
  );
}

export function resolveLegalNavLocale(
  pathname: string | null | undefined,
  value: LegalParamValue,
): LegalLocale {
  if (!isLegalPathname(pathname)) return "en";
  return resolveLegalLocale(value);
}

export function buildLegalHref(
  documentId: LegalDocumentId,
  locale: LegalLocale,
): string {
  const path = LEGAL_DOCUMENT_PATHS[documentId];
  return locale === "de" ? `${path}?lang=de` : path;
}
