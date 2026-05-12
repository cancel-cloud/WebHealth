export const LEGAL_LOCALES = ["en", "de"] as const;

export type LegalLocale = (typeof LEGAL_LOCALES)[number];
export type LegalParamValue = string | string[] | null | undefined;

export const LEGAL_DOCUMENT_PATHS = {
  privacy: "/privacy",
  terms: "/terms",
  impressum: "/impressum",
  dpa: "/dpa",
} as const;

export type LegalDocumentId = keyof typeof LEGAL_DOCUMENT_PATHS;
export type LegalDocumentPath = (typeof LEGAL_DOCUMENT_PATHS)[LegalDocumentId];
export type LocalizedLegalDocumentPath = `/${LegalLocale}${LegalDocumentPath}`;

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
    dpa: "Data Processing Agreement",
  },
  de: {
    privacy: "Datenschutzhinweise",
    terms: "Nutzungsbedingungen",
    impressum: "Impressum",
    dpa: "Auftragsverarbeitungsvertrag",
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
): boolean {
  return getLegalDocumentIdFromPathname(pathname) !== null;
}

export function resolveLegalNavLocale(
  pathname: string | null | undefined,
  value: LegalParamValue,
): LegalLocale {
  const pathLocale = getLegalLocaleFromPathname(pathname);
  if (pathLocale) return pathLocale;
  if (!isLegalPathname(pathname)) return "en";
  return resolveLegalLocale(value);
}

export function getLegalDocumentIdFromSlug(
  slug: string | null | undefined,
): LegalDocumentId | null {
  const match = LEGAL_DOCUMENT_IDS.find(
    (documentId) => LEGAL_DOCUMENT_PATHS[documentId].slice(1) === slug,
  );
  return match ?? null;
}

export function getLegalDocumentIdFromPathname(
  pathname: string | null | undefined,
): LegalDocumentId | null {
  if (!pathname) return null;
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const legacyMatch = LEGAL_DOCUMENT_IDS.find(
    (documentId) => LEGAL_DOCUMENT_PATHS[documentId] === normalized,
  );
  if (legacyMatch) return legacyMatch;

  const [, locale, slug] = normalized.split("/");
  if (!hasLegalLocale(locale)) return null;
  return getLegalDocumentIdFromSlug(slug);
}

export function getLegalLocaleFromPathname(
  pathname: string | null | undefined,
): LegalLocale | null {
  if (!pathname) return null;
  const [, locale, slug] = pathname.split("/");
  if (!hasLegalLocale(locale)) return null;
  return getLegalDocumentIdFromSlug(slug) ? locale : null;
}

export function buildLegalHref(
  documentId: LegalDocumentId,
  locale: LegalLocale,
): LocalizedLegalDocumentPath {
  const path = LEGAL_DOCUMENT_PATHS[documentId];
  return `/${locale}${path}`;
}

export function getLegacyLegalRedirectPath(
  documentId: LegalDocumentId,
  value: LegalParamValue,
) {
  return buildLegalHref(documentId, resolveLegalLocale(value));
}
