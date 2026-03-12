import {
  getDataProtectionOfficerParagraphs,
  getDisputeResolutionStatement,
  getImpressumContactParagraphs,
  getImpressumProviderParagraphs,
  getOperatorDisplayName,
  getPrivacyContactSentence,
  getRegisterEntryParagraphs,
  getTaxIdentifierParagraphs,
  legalProfile,
} from "./legal-profile";
import type { LegalDictionary } from "./legal-types";

export const legalDictionaryEn = {
  locale: "en",
  ui: {
    languageToggleLabel: "Document language",
    languageLabels: {
      en: "English",
      de: "Deutsch",
    },
    documentLabels: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      impressum: "Impressum",
    },
    relatedDocumentsLabel: "Related legal documents",
  },
  documents: {
    privacy: {
      title: "Privacy Policy",
      description: "How Webhealth collects, uses, stores, and protects personal data.",
      lastUpdatedLabel: "Last updated: March 2026",
      intro: [
        `${legalProfile.productName} is operated by ${getOperatorDisplayName("en")}. This notice explains how we process personal data when you visit the site, sign in with Google, connect data sources, generate reports, contact support, or use paid features.`,
        "This document is written to work for both business and consumer users. Mandatory statutory rights remain unaffected.",
      ],
      sections: [
        {
          title: "Controller and contact",
          paragraphs: [
            `Controller: ${getOperatorDisplayName("en")}, ${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, ${legalProfile.country}.`,
            `General contact: ${legalProfile.email}. ${getPrivacyContactSentence("en")}`,
          ],
        },
        {
          title: "Data categories we process",
          bullets: [
            "Account and identity data such as name, email address, profile image, Google account identifiers, and session details.",
            "Encrypted Google provider tokens, token expiry data, and Google locale information needed to keep Search Console and Analytics access working.",
            "Google Search Console metrics such as clicks, impressions, CTR, position, queries, and page-level performance.",
            "Google Analytics 4 metrics such as sessions, users, new users, traffic-source breakdowns, landing pages, and other report inputs connected to the selected property.",
            "Crawl and website-audit data from publicly accessible pages, including broken links, missing metadata, and other technical findings.",
            "Workspace settings, report history, billing status, feature flags, and plan usage records.",
            "Support and feedback data, including message contents and the account details attached to the submission.",
            "Security and audit data such as IP address, user agent, admin/system log entries, and operational error details.",
            "Browser/device storage data, including authentication cookies, UI-state cookies, and local storage entries used for onboarding or pending actions.",
          ],
        },
        {
          title: "Purposes and legal bases",
          bullets: [
            "Provide the service, authenticate users, and generate requested reports: performance of a contract or steps taken before entering a contract.",
            "Automatically sync available Google properties after sign-in so the workspace can be configured: performance of a contract and our legitimate interest in reducing setup friction.",
            "Process subscriptions, receipts, cancellations, and plan enforcement: performance of a contract and legal obligations for tax/accounting records.",
            "Operate the report pipeline, including AI-assisted analysis of report context: performance of a contract.",
            "Handle support requests, feedback, and account communications: performance of a contract and our legitimate interest in user support.",
            "Prevent abuse, secure the service, investigate incidents, and maintain audit trails: legitimate interests in security, fraud prevention, and reliable operations.",
            "Measure product usage and diagnose errors using privacy-aware analytics and monitoring tools: legitimate interests in improving and maintaining the service.",
          ],
        },
        {
          title: "Google API access and service behavior",
          paragraphs: [
            "When you sign in with Google, we request read-only access for Google Search Console and Google Analytics 4 plus basic identity scopes. We do not request write access to your Google account.",
            "After the first Google sign-in, the app may automatically sync accessible Search Console and GA4 properties into your workspace. Report generation then uses the selected connected property and any related data needed to produce the report.",
            "We use Google-derived data only to provide, secure, and improve the requested reporting features. We do not sell Google user data or use it for unrelated advertising purposes.",
          ],
        },
        {
          title: "Recipients and processors",
          bullets: [
            "Google, for OAuth sign-in and as the connected data source for Search Console and GA4.",
            "OpenAI, to process selected report context, URLs, metrics, and structured audit data in order to generate AI-assisted report output.",
            "Stripe, to create customer records, process subscriptions, and manage the billing portal.",
            "Vercel, to host and serve the web application.",
            "Neon/PostgreSQL, to host the application database in the EU.",
            "GlitchTip, to capture operational errors and security-relevant exceptions.",
            "Vercel Analytics, to collect privacy-aware product analytics about site usage.",
          ],
        },
        {
          title: "International transfers",
          paragraphs: [
            "Some processors may process or make data accessible outside the EU/EEA, including the United States. This can apply in particular to Google, OpenAI, Stripe, Vercel, and GlitchTip depending on the service flow and subprocessors involved.",
            "Where required, we rely on transfer mechanisms such as adequacy decisions, the EU-U.S. Data Privacy Framework where applicable, or standard contractual clauses and related safeguards.",
          ],
        },
        {
          title: "Retention",
          bullets: [
            "Account profile and workspace records are retained for as long as the account remains active, unless a longer retention period is legally required.",
            "Reports, generated insights, and related metrics remain available while the account is active, subject to deletion requests and operational retention windows.",
            "Feedback submissions, audit logs, and security events are retained for as long as needed for support, abuse prevention, and accountability, then deleted or anonymized in line with operational retention rules.",
            "Billing and accounting records may be retained longer where tax or commercial law requires it.",
          ],
        },
        {
          title: "Required data and automated decision-making",
          paragraphs: [
            "Certain data is required to create an account, connect Google data sources, purchase a paid plan, or generate reports. If you do not provide the required data for those steps, we may be unable to provide the relevant part of the service.",
            "We do not use solely automated decision-making, including profiling, that produces legal effects or similarly significant effects within the meaning of Article 22 GDPR.",
          ],
        },
        {
          title: "Cookies and device storage",
          paragraphs: [
            "We use cookies and other device storage that are necessary to run the service and remember basic UI state. This includes authentication/session cookies, a sidebar-state cookie, and local storage entries used for onboarding or pending UI actions.",
            "We do not currently use advertising cookies. If non-essential tracking or marketing storage is introduced later, we will update this notice and any consent flow as required.",
          ],
        },
        {
          title: "Your rights",
          bullets: [
            "You may request access to your personal data, rectification, erasure, restriction of processing, data portability, or object to processing where the law grants that right.",
            "Where processing is based on consent, you may withdraw consent at any time without affecting prior processing.",
            `You may lodge a complaint with a competent supervisory authority. For Hesse, Germany, this is currently ${legalProfile.supervisoryAuthority}.`,
          ],
        },
        {
          title: "Changes to this notice",
          paragraphs: [
            "We may update this notice when the product, processors, or legal requirements change. Material updates will be communicated through the service or by email where appropriate.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      description: "Terms governing access to and use of the Webhealth service.",
      lastUpdatedLabel: "Last updated: March 2026",
      intro: [
        `${legalProfile.productName} is provided by ${getOperatorDisplayName("en")}. These terms are written to cover both business customers and consumers unless a specific clause says otherwise.`,
      ],
      sections: [
        {
          title: "Acceptance and eligibility",
          paragraphs: [
            "By creating an account, connecting a data source, or using the service, you agree to these terms. If you do not agree, do not use the service.",
            "You must be legally capable of entering into a contract and must use an account you are authorized to control.",
          ],
        },
        {
          title: "Service description",
          paragraphs: [
            "Webhealth connects to Google Search Console and Google Analytics 4, performs website crawls, and generates SEO and analytics reporting with AI-assisted summaries and action items.",
            "The service is intended to help users review website performance. It does not replace legal, tax, financial, or professional consulting advice.",
          ],
        },
        {
          title: "Accounts and acceptable use",
          bullets: [
            "Use the service only for websites and data sources you own or are authorized to manage.",
            "Do not attempt to disrupt, reverse engineer, resell, or misuse the service or its rate limits.",
            "Keep your sign-in credentials and connected Google account secure.",
            "You remain responsible for the legality of your content, inputs, and use of generated recommendations.",
          ],
        },
        {
          title: "Plans, billing, and cancellation",
          paragraphs: [
            `The service currently offers a Solo plan and paid plans including Pro (${legalProfile.productName} uses Stripe for billing). Prices and plan limits are presented in the product and at checkout.`,
            "Paid subscriptions renew according to the plan shown at checkout unless cancelled. You may manage cancellation through the billing portal. Any statutory consumer rights, including mandatory cancellation or withdrawal rights where applicable, remain unaffected.",
            "Refund handling follows the checkout terms, applicable law, and any mandatory consumer protections that apply to your purchase.",
          ],
        },
        {
          title: "AI-assisted output",
          paragraphs: [
            "Reports may include AI-assisted analysis generated from connected metrics, crawl findings, and report context. AI output can be incomplete or inaccurate and should be reviewed before you act on it.",
            "You remain responsible for decisions you make based on the report output.",
          ],
        },
        {
          title: "Availability and changes",
          paragraphs: [
            "We may update, improve, or modify the service where reasonably necessary to maintain security, comply with law, improve functionality, or reflect product changes.",
            "Where a change materially reduces a paid feature you rely on, we will provide notice where required by law.",
          ],
        },
        {
          title: "Intellectual property",
          paragraphs: [
            "We retain all rights in the service, software, branding, and our original materials. You retain rights in the data and report inputs you provide.",
            "You receive a limited, non-exclusive, non-transferable right to use the service in accordance with these terms.",
          ],
        },
        {
          title: "Liability and mandatory rights",
          paragraphs: [
            "Nothing in these terms excludes or limits liability for intent, gross negligence, injury to life, body, or health, or any liability that cannot be limited under applicable law.",
            "For slight negligence, liability is limited to foreseeable damage typical for this type of contract, except where mandatory law provides otherwise.",
            "Any mandatory statutory rights you have as a consumer remain unaffected.",
          ],
        },
        {
          title: "Governing law, jurisdiction, and disputes",
          paragraphs: [
            "These terms are governed by German law. If you are a consumer residing in another country, you continue to benefit from any mandatory protections granted by the law of your habitual residence.",
            `If you are a business customer, the exclusive place of jurisdiction is ${legalProfile.city}, Germany, to the extent permitted by law. Consumers may bring claims before the courts available to them under mandatory law.`,
            getDisputeResolutionStatement("en"),
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            `Questions about these terms can be sent to ${legalProfile.email}.`,
          ],
        },
      ],
    },
    impressum: {
      title: "Impressum (Legal Notice)",
      description: "Provider identification and mandatory legal information for Webhealth.",
      lastUpdatedLabel: "Last updated: March 2026",
      languageNotice:
        "“Impressum” is the German legal notice / provider identification page.",
      intro: [
        "This page contains the provider identification and consumer-dispute statement for Webhealth.",
      ],
      sections: [
        {
          title: "Provider",
          paragraphs: getImpressumProviderParagraphs("en"),
        },
        {
          title: "Contact",
          paragraphs: getImpressumContactParagraphs("en"),
        },
        ...(getRegisterEntryParagraphs("en").length
          ? [
              {
                title: "Register entry",
                paragraphs: getRegisterEntryParagraphs("en"),
              },
            ]
          : []),
        ...(getTaxIdentifierParagraphs("en").length
          ? [
              {
                title: "Tax identifiers",
                paragraphs: getTaxIdentifierParagraphs("en"),
              },
            ]
          : []),
        ...(getDataProtectionOfficerParagraphs("en").length
          ? [
              {
                title: "Data Protection Officer",
                paragraphs: getDataProtectionOfficerParagraphs("en"),
              },
            ]
          : []),
        {
          title: "Consumer dispute resolution",
          paragraphs: [getDisputeResolutionStatement("en")],
        },
      ],
    },
  },
} satisfies LegalDictionary;
