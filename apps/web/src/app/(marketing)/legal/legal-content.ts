import type { LegalDocumentId, LegalLocale } from "./legal-routes";
import { legalDictionaryDe } from "./legal-dictionaries.de";
import { legalDictionaryEn } from "./legal-dictionaries.en";
import type { LegalDictionary, LegalDocument } from "./legal-types";

export const legalDictionaries: Record<LegalLocale, LegalDictionary> = {
  en: legalDictionaryEn,
  de: legalDictionaryDe,
};

export function getLegalDocument(
  locale: LegalLocale,
  documentId: LegalDocumentId,
): LegalDocument {
  return legalDictionaries[locale].documents[documentId];
}
