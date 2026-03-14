import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

async function importModule(path: string) {
  try {
    return await import(path);
  } catch {
    return null;
  }
}

test("resolveLegalLocale defaults to English and accepts German", async () => {
  const legal = await importModule("./legal");
  const resolveLegalLocale = (legal as { resolveLegalLocale?: (value?: string | string[] | null) => string } | null)
    ?.resolveLegalLocale;

  assert.equal(typeof resolveLegalLocale, "function");
  assert.equal(resolveLegalLocale?.(undefined), "en");
  assert.equal(resolveLegalLocale?.("de"), "de");
  assert.equal(resolveLegalLocale?.("fr"), "en");
  assert.equal(resolveLegalLocale?.(["de", "en"]), "de");
});

test("buildLegalHref keeps the base slug and adds the German query param only when needed", async () => {
  const legal = await importModule("./legal");
  const buildLegalHref = (legal as {
    buildLegalHref?: (documentId: "privacy" | "terms" | "impressum", locale: "en" | "de") => string;
  } | null)?.buildLegalHref;

  assert.equal(typeof buildLegalHref, "function");
  assert.equal(buildLegalHref?.("privacy", "en"), "/privacy");
  assert.equal(buildLegalHref?.("privacy", "de"), "/privacy?lang=de");
  assert.equal(buildLegalHref?.("impressum", "de"), "/impressum?lang=de");
});

test("resolveLegalNavLocale only preserves language on legal pages", async () => {
  const legal = await importModule("./legal");
  const resolveLegalNavLocale = (legal as {
    resolveLegalNavLocale?: (pathname: string | null | undefined, value?: string | string[] | null) => string;
  } | null)?.resolveLegalNavLocale;

  assert.equal(typeof resolveLegalNavLocale, "function");
  assert.equal(resolveLegalNavLocale?.("/privacy", "de"), "de");
  assert.equal(resolveLegalNavLocale?.("/terms", "fr"), "en");
  assert.equal(resolveLegalNavLocale?.("/settings", "de"), "en");
});

test("buildLegalMetadata exposes canonical base URLs and German alternates", async () => {
  const legal = await importModule("./legal");
  const buildLegalMetadata = (legal as {
    buildLegalMetadata?: (documentId: "privacy" | "terms" | "impressum", locale: "en" | "de") => {
      alternates?: {
        canonical?: string;
        languages?: Record<string, string>;
      };
    };
  } | null)?.buildLegalMetadata;

  assert.equal(typeof buildLegalMetadata, "function");

  const metadata = buildLegalMetadata?.("terms", "de");
  assert.equal(metadata?.alternates?.canonical, "/terms");
  assert.deepEqual(metadata?.alternates?.languages, {
    en: "/terms",
    de: "/terms?lang=de",
  });
});

test("legal dictionaries stay aligned across English and German", async () => {
  const content = await importModule("./legal-content");
  const legalDictionaries = (content as {
    legalDictionaries?: {
      en: { documents: Record<string, { title: string; sections: unknown[] }> };
      de: { documents: Record<string, { title: string; sections: unknown[] }> };
    };
  } | null)?.legalDictionaries;

  assert.ok(legalDictionaries);
  assert.deepEqual(Object.keys(legalDictionaries.en.documents), [
    "privacy",
    "terms",
    "impressum",
  ]);
  assert.deepEqual(
    Object.keys(legalDictionaries.en.documents),
    Object.keys(legalDictionaries.de.documents),
  );

  for (const documentId of Object.keys(legalDictionaries.en.documents)) {
    assert.ok(legalDictionaries.en.documents[documentId].title.length > 0);
    assert.ok(legalDictionaries.de.documents[documentId].title.length > 0);
    assert.ok(legalDictionaries.en.documents[documentId].sections.length > 0);
    assert.ok(legalDictionaries.de.documents[documentId].sections.length > 0);
  }
});

test("privacy dictionaries explicitly cover required data and absence of Article 22 decisions", async () => {
  const content = await importModule("./legal-content");
  const legalDictionaries = (content as {
    legalDictionaries?: {
      en: { documents: { privacy: { sections: Array<{ title: string; paragraphs?: string[]; bullets?: string[] }> } } };
      de: { documents: { privacy: { sections: Array<{ title: string; paragraphs?: string[]; bullets?: string[] }> } } };
    };
  } | null)?.legalDictionaries;

  assert.ok(legalDictionaries);

  const englishPrivacyText = legalDictionaries.en.documents.privacy.sections
    .flatMap((section) => [...(section.paragraphs ?? []), ...(section.bullets ?? [])])
    .join(" ");
  const germanPrivacyText = legalDictionaries.de.documents.privacy.sections
    .flatMap((section) => [...(section.paragraphs ?? []), ...(section.bullets ?? [])])
    .join(" ");

  assert.match(englishPrivacyText, /required to create an account/i);
  assert.match(englishPrivacyText, /Article 22 GDPR/i);
  assert.match(englishPrivacyText, /Google Analytics 4/i);
  assert.match(englishPrivacyText, /cookie settings/i);
  assert.match(englishPrivacyText, /consent/i);

  assert.match(germanPrivacyText, /erforderlich/i);
  assert.match(germanPrivacyText, /Artikel 22 DSGVO/i);
  assert.match(germanPrivacyText, /Google Analytics 4/i);
  assert.match(germanPrivacyText, /Cookie-Einstellungen/i);
  assert.match(germanPrivacyText, /Einwilligung|Zustimmung/i);
});

test("legal profile exposes the core business fields", async () => {
  const profileModule = await importModule("./legal-profile");
  const legalProfile = (profileModule as {
    legalProfile?: Record<string, string | null>;
  } | null)?.legalProfile;

  assert.ok(legalProfile);
  assert.equal(typeof legalProfile.legalName, "string");
  assert.equal(typeof legalProfile.businessName, "string");
  assert.equal(typeof legalProfile.streetAddress, "string");
  assert.equal(typeof legalProfile.city, "string");
  assert.equal(typeof legalProfile.email, "string");
  assert.equal(typeof legalProfile.supervisoryAuthority, "string");
});

test("legal document chrome shows centered document/language buttons without an extra language heading", async () => {
  const [{ LegalDocumentPage }, { legalDictionaryEn }] = await Promise.all([
    import("./legal-document-page"),
    import("./legal-dictionaries.en"),
  ]);

  const markup = renderToStaticMarkup(
    createElement(LegalDocumentPage, {
      documentId: "privacy",
      locale: "en",
      dictionary: legalDictionaryEn,
    }),
  );

  assert.match(markup, /Privacy Policy/);
  assert.match(markup, /Terms of Service/);
  assert.match(markup, /Impressum/);
  assert.match(markup, />English</);
  assert.match(markup, />Deutsch</);
  assert.doesNotMatch(markup, /Read this document in/);
});

test("legal profile formats the sole-trader operator name per locale", async () => {
  const profileModule = await importModule("./legal-profile");
  const getOperatorDisplayName = (profileModule as {
    getOperatorDisplayName?: (locale: "en" | "de") => string;
  } | null)?.getOperatorDisplayName;

  assert.equal(typeof getOperatorDisplayName, "function");
  assert.equal(
    getOperatorDisplayName?.("en"),
    "Lukas Dienst, trading as DevBrew Development",
  );
  assert.equal(
    getOperatorDisplayName?.("de"),
    'Lukas Dienst, handelnd unter "DevBrew Development"',
  );
});

test("impressum omits phone, register, VAT, and DPO blocks when those details are absent", async () => {
  const [{ LegalDocumentPage }, { legalDictionaryDe }] = await Promise.all([
    import("./legal-document-page"),
    import("./legal-dictionaries.de"),
  ]);

  const markup = renderToStaticMarkup(
    createElement(LegalDocumentPage, {
      documentId: "impressum",
      locale: "de",
      dictionary: legalDictionaryDe,
    }),
  );

  assert.match(markup, /Lukas Dienst/);
  assert.match(markup, /DevBrew Development/);
  assert.doesNotMatch(markup, /Telefon:/);
  assert.doesNotMatch(markup, /Registergericht:/);
  assert.doesNotMatch(markup, /USt-IdNr/);
  assert.doesNotMatch(markup, /Datenschutzkontakt/);
});
