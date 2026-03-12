import "server-only";

import type { LegalLocale } from "./legal-routes";
import type { LegalDictionary } from "./legal-types";

const dictionaries = {
  en: () =>
    import("./legal-dictionaries.en").then((module) => module.legalDictionaryEn),
  de: () =>
    import("./legal-dictionaries.de").then((module) => module.legalDictionaryDe),
} satisfies Record<LegalLocale, () => Promise<LegalDictionary>>;

export async function getLegalDictionary(locale: LegalLocale) {
  return dictionaries[locale]();
}
