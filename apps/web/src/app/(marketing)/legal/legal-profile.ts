import type { LegalLocale } from "./legal-routes";

type LocalizedText = Record<LegalLocale, string>;

type LegalProfile = {
  legalName: string;
  businessName: string;
  productName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  privacyEmail: string | null;
  phone: string | null;
  registerCourt: string | null;
  registerNumber: string | null;
  vatId: string | null;
  economicId: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  supervisoryAuthority: string;
  disputeResolutionStatement: LocalizedText;
};

// Optional legal identifiers can stay null until they exist in the business
// profile. The legal pages omit null fields automatically.
export const legalProfile: LegalProfile = {
  legalName: "Lukas Dienst",
  businessName: "DevBrew Development",
  productName: "Webhealth",
  streetAddress: "Am Holzweg 11",
  postalCode: "35789",
  city: "Weilmünster",
  country: "Germany",
  email: "kontakt@devbrew.dev",
  privacyEmail: "kontakt@devbrew.dev",
  phone: "+49(0)1703044192",
  registerCourt: null,
  registerNumber: null,
  vatId: null,
  economicId: "DE445529090",
  dpoName: null,
  dpoEmail: null,
  supervisoryAuthority:
    "Der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI), Wiesbaden",
  disputeResolutionStatement: {
    en: "We are not willing and not obliged to participate in dispute resolution proceedings before a consumer arbitration board unless mandatory law requires otherwise.",
    de: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen, soweit keine gesetzliche Verpflichtung besteht.",
  },
};

export function getCountryName(locale: LegalLocale) {
  return locale === "de" ? "Deutschland" : legalProfile.country;
}

export function getOperatorDisplayName(locale: LegalLocale) {
  if (locale === "de") {
    return `${legalProfile.legalName}, handelnd unter "${legalProfile.businessName}"`;
  }

  return `${legalProfile.legalName}, trading as ${legalProfile.businessName}`;
}

export function getLegalAddressLines(locale: LegalLocale) {
  return [
    getOperatorDisplayName(locale),
    legalProfile.streetAddress,
    `${legalProfile.postalCode} ${legalProfile.city}`,
    getCountryName(locale),
  ];
}

export function getPrivacyContactEmail() {
  return legalProfile.privacyEmail ?? legalProfile.email;
}

export function hasDataProtectionOfficer() {
  return Boolean(legalProfile.dpoName && legalProfile.dpoEmail);
}

export function getPrivacyContactSentence(locale: LegalLocale) {
  if (hasDataProtectionOfficer()) {
    if (locale === "de") {
      return `Datenschutzbeauftragte/r: ${legalProfile.dpoName}, ${legalProfile.dpoEmail}.`;
    }

    return `Data Protection Officer: ${legalProfile.dpoName}, ${legalProfile.dpoEmail}.`;
  }

  if (locale === "de") {
    return `Datenschutzkontakt: ${getPrivacyContactEmail()}.`;
  }

  return `Privacy contact: ${getPrivacyContactEmail()}.`;
}

export function getImpressumProviderParagraphs(locale: LegalLocale) {
  return [
    getOperatorDisplayName(locale),
    `${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, ${getCountryName(locale)}`,
  ];
}

export function getImpressumContactParagraphs(locale: LegalLocale) {
  const paragraphs = [
    locale === "de"
      ? `E-Mail: ${legalProfile.email}`
      : `Email: ${legalProfile.email}`,
  ];

  if (legalProfile.phone) {
    paragraphs.push(
      locale === "de"
        ? `Telefon: ${legalProfile.phone}`
        : `Phone: ${legalProfile.phone}`,
    );
  }

  return paragraphs;
}

export function getRegisterEntryParagraphs(locale: LegalLocale) {
  if (!legalProfile.registerCourt || !legalProfile.registerNumber) {
    return [];
  }

  if (locale === "de") {
    return [
      `Registergericht: ${legalProfile.registerCourt}`,
      `Registernummer: ${legalProfile.registerNumber}`,
    ];
  }

  return [
    `Register court: ${legalProfile.registerCourt}`,
    `Register number: ${legalProfile.registerNumber}`,
  ];
}

export function getTaxIdentifierParagraphs(locale: LegalLocale) {
  const paragraphs: string[] = [];

  if (legalProfile.vatId) {
    paragraphs.push(
      locale === "de"
        ? `USt-IdNr. gemaess § 27a UStG: ${legalProfile.vatId}`
        : `VAT ID according to § 27a UStG: ${legalProfile.vatId}`,
    );
  }

  if (legalProfile.economicId) {
    paragraphs.push(
      locale === "de"
        ? `Wirtschafts-Identifikationsnummer gemaess § 139c AO: ${legalProfile.economicId}`
        : `Economic identification number according to § 139c AO: ${legalProfile.economicId}`,
    );
  }

  return paragraphs;
}

export function getDataProtectionOfficerParagraphs(locale: LegalLocale) {
  if (!hasDataProtectionOfficer()) {
    return [];
  }

  if (locale === "de") {
    return [
      `Datenschutzbeauftragte/r: ${legalProfile.dpoName} — ${legalProfile.dpoEmail}`,
    ];
  }

  return [
    `Data Protection Officer: ${legalProfile.dpoName} — ${legalProfile.dpoEmail}`,
  ];
}

export function getDisputeResolutionStatement(locale: LegalLocale) {
  return legalProfile.disputeResolutionStatement[locale];
}
