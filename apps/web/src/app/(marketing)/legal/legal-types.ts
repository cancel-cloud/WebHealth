import type { LegalDocumentId, LegalLocale } from "./legal-routes";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  lastUpdatedLabel: string;
  languageNotice?: string;
  intro: string[];
  sections: LegalSection[];
};

export type LegalDictionary = {
  locale: LegalLocale;
  ui: {
    languageToggleLabel: string;
    languageLabels: Record<LegalLocale, string>;
    documentLabels: Record<LegalDocumentId, string>;
    relatedDocumentsLabel: string;
  };
  documents: Record<LegalDocumentId, LegalDocument>;
};
