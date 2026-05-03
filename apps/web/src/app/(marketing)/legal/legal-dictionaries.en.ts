import {
  getDataProtectionOfficerParagraphs,
  getDisputeResolutionStatement,
  getImpressumContactParagraphs,
  getImpressumProviderParagraphs,
  getOperatorDisplayName,
  getPrivacyContactSentence,
  getPrivacyContactEmail,
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
      dpa: "Data Processing Agreement",
    },
    relatedDocumentsLabel: "Related legal documents",
  },
  documents: {
    privacy: {
      title: "Privacy Policy",
      description: "How Webhealth collects, uses, and protects personal data when connecting Search Console and Analytics 4 — encryption, retention, and your rights.",
      lastUpdatedLabel: "Last updated: March 2026",
      intro: [
        `${legalProfile.productName} is operated by ${getOperatorDisplayName("en")}. This notice explains how we process personal data when you visit the site, sign in with Google, connect data sources, generate snapshots, contact support, or use paid features.`,
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
            "Google Analytics 4 metrics such as sessions, users, new users, traffic-source breakdowns, landing pages, and other snapshot inputs connected to the selected property.",
            "Crawl and website-audit data from publicly accessible pages, including broken links, missing metadata, and other technical findings.",
            "Workspace settings, snapshot history, billing status, feature flags, and plan usage records.",
            "Support and feedback data, including message contents and the account details attached to the submission.",
            "Security and audit data such as IP address, user agent, admin/system log entries, and operational error details.",
            "Browser/device storage data, including authentication cookies, UI-state cookies, and local storage entries used for onboarding or pending actions.",
          ],
        },
        {
          title: "Purposes and legal bases",
          bullets: [
            "Provide the service, authenticate users, and create requested snapshots: performance of a contract or steps taken before entering a contract.",
            "Automatically sync available Google properties after sign-in so the workspace can be configured: performance of a contract and our legitimate interest in reducing setup friction.",
            "Process subscriptions, receipts, cancellations, and plan enforcement: performance of a contract and legal obligations for tax/accounting records.",
            "Operate snapshot exports, live dashboards, source-data refreshes, and property refreshes: performance of a contract.",
            "Handle support requests, feedback, and account communications: performance of a contract and our legitimate interest in user support.",
            "Prevent abuse, secure the service, investigate incidents, and maintain audit trails: legitimate interests in security, fraud prevention, and reliable operations.",
            "Measure website usage with Google Analytics 4 after you accept analytics cookies: consent.",
          ],
        },
        {
          title: "Google API access and service behavior",
          paragraphs: [
            "When you sign in with Google, we request read-only access for Google Search Console and Google Analytics 4 plus basic identity scopes. We do not request write access to your Google account.",
            "After the first Google sign-in, the app may automatically sync accessible Search Console and GA4 properties into your workspace. Snapshot generation then uses the selected connected property and any related data needed to produce the snapshot.",
            "We use Google-derived data only to provide, secure, and improve the requested snapshot and dashboard features. We do not sell Google user data or use it for unrelated advertising purposes.",
          ],
        },
        {
          title: "Google Analytics 4 website tracking",
          paragraphs: [
            "We use Google Analytics 4 to measure how visitors use the website, including page views, navigation events, approximate device and browser details, referrer information, and interaction events.",
            "Google Analytics 4 is activated only after you accept analytics cookies in the consent banner. If you decline, the Google tag is not loaded. You can change your choice later at any time through Cookie settings in the footer.",
          ],
        },
        {
          title: "Vercel Analytics",
          paragraphs: [
            "We use Vercel Analytics to measure how visitors use the website. This may include page views, referrers, device type, browser type, and country of origin (derived from IP address). Vercel Analytics does not set cookies and does not use persistent identifiers.",
            "Processing is based on our legitimate interest in measuring website usage (Article 6(1)(f) GDPR). Because no cookies or client-side storage are used, § 25 TDDDG does not apply. You may object to this processing.",
          ],
        },
        {
          title: "Recipients and processors",
          bullets: [
            "Google Ireland Ltd. (Gordon House, Barrow Street, Dublin 4, Ireland) and/or Google LLC, for OAuth sign-in, as the connected data source for Search Console and GA4, and as the provider of Google Analytics 4 website analytics after consent.",
            "OpenAI, L.L.C. (San Francisco, USA) to generate AI-assisted snapshot recommendations and to process imported OpenAI billing data where configured. A data processing addendum is in place.",
            "Stripe Payments Europe Ltd. (Dublin, Ireland) and Stripe Inc. (USA), to create customer records, process subscriptions, manage the billing portal, and deliver transactional payment and receipt emails.",
            "Vercel Inc. (San Francisco, USA), to host and serve the web application; the frontend runs in the Vercel Frankfurt (EU) region.",
            "Hetzner Online GmbH (Industriestraße 25, 91710 Gunzenhausen, Germany), to host the self-managed PostgreSQL database and the worker infrastructure in the Nuremberg (EU) data center. A data processing agreement with Hetzner is in place.",
            "GlitchTip, to capture operational errors and security-relevant exceptions — self-hosted on Hetzner infrastructure in Nuremberg, with no transfer to any third party.",
            "PostHog Inc. (San Francisco, USA), operated via the EU instance in Frankfurt, for server-side product analytics (e.g., snapshot-creation and plan events). PostHog does not set its own browser cookies; data is sent server-side to the EU instance. A data processing addendum is in place.",
            "Vercel Analytics, for cookieless measurement of page views, referrers, device type, and country of origin. Vercel processes this data on its own infrastructure; IP addresses are not stored persistently.",
          ],
        },
        {
          title: "Processing of customer data sources (GSC & GA4)",
          paragraphs: [
            "When you connect your Google Search Console or Google Analytics 4 property to Webhealth as a business customer, we process the search, click, impression, and usage data associated with your property on your behalf. To the extent that this data contains personal data of your end users, you are the controller within the meaning of the GDPR and Webhealth acts as a processor under Article 28 GDPR.",
            "A data processing agreement (Auftragsverarbeitungsvertrag / DPA) is available on request — please contact the email address listed under “Controller and contact”. The list of sub-processors corresponds to the providers listed above under “Recipients and processors”.",
          ],
        },
        {
          title: "Data security",
          bullets: [
            "All network traffic between your browser, our servers, and third-party processors is encrypted in transit using TLS (HTTPS).",
            "Google OAuth tokens — including access tokens, refresh tokens, and ID tokens — are encrypted at rest using AES-256-GCM with unique initialisation vectors before being stored in the database.",
            "Google user data obtained through the Search Console and Analytics APIs is stored in an encrypted database and protected by the same access controls that apply to all application data.",
            "The application database is hosted on operator-managed PostgreSQL infrastructure in the EU with restricted network exposure and authenticated administrative access.",
            "Access to production infrastructure, the database, and encryption keys is restricted to the operator and protected by strong authentication.",
            "We maintain procedures to detect, investigate, and respond to security incidents, including notifying affected users and supervisory authorities where required by applicable law.",
            "Third-party processors are selected with regard to their technical and organisational security measures and are bound by data processing agreements.",
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
            "Snapshots, generated insights, and related metrics remain available while the account is active, subject to deletion requests and operational retention windows.",
            "If you disconnect a Google data source or revoke access, the associated tokens are deleted promptly. If you delete your account, all stored Google user data — including tokens, synced properties, and snapshot data — is deleted.",
            "Feedback submissions, audit logs, and security events are retained for as long as needed for support, abuse prevention, and accountability, then deleted or anonymized in line with operational retention rules.",
            "Billing and accounting records may be retained longer where tax or commercial law requires it.",
          ],
        },
        {
          title: "Required data and automated decision-making",
          paragraphs: [
            "Certain data is required to create an account, connect Google data sources, purchase a paid plan, or generate snapshots. If you do not provide the required data for those steps, we may be unable to provide the relevant part of the service.",
            "We do not use solely automated decision-making, including profiling, that produces legal effects or similarly significant effects within the meaning of Article 22 GDPR.",
          ],
        },
        {
          title: "Cookies and device storage",
          paragraphs: [
            "We use cookies and other device storage that are necessary to run the service and remember basic UI state. This includes authentication/session cookies, a sidebar-state cookie, and local storage entries used for onboarding, pending UI actions, and your saved analytics consent preference.",
            "If you accept analytics cookies, we also load the Google tag for Google Analytics 4 website measurement. If you decline, the Google tag remains disabled.",
          ],
        },
        {
          title: "Your rights",
          bullets: [
            "You may request access to your personal data, rectification, erasure, restriction of processing, data portability, or object to processing where the law grants that right.",
            "Where processing is based on consent, you may withdraw or change that consent at any time without affecting prior processing, including through Cookie settings in the footer.",
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
      description: "Terms governing use of the Webhealth SEO and analytics service — plans, billing, cancellation, intellectual property, and consumer rights.",
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
            "Webhealth connects to Google Search Console and Google Analytics 4, performs website crawls, and provides SEO and analytics live dashboards, snapshot exports, and deterministic action items.",
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
          title: "Snapshot output",
          paragraphs: [
            "Snapshots and dashboards are generated from connected metrics, crawl findings, and deterministic ranking logic. Review the underlying data before you act on it.",
            "You remain responsible for decisions you make based on the snapshot output.",
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
            "We retain all rights in the service, software, branding, and our original materials. You retain rights in the data and snapshot inputs you provide.",
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
      description: "Provider identification, contact details, and mandatory legal information per § 5 DDG and § 18(2) MStV for the Webhealth SEO and analytics service operated by DevBrew.",
      lastUpdatedLabel: "Last updated: March 2026",
      languageNotice:
        "“Impressum” is the German legal notice / provider identification page required under § 5 DDG (formerly § 5 TMG).",
      intro: [
        "This page contains the provider identification per § 5 DDG (formerly § 5 TMG), the editorial-content responsibility statement under § 18(2) MStV, and the consumer-dispute information for Webhealth.",
      ],
      sections: [
        {
          title: "Provider",
          paragraphs: getImpressumProviderParagraphs("en"),
        },
        {
          title: "Represented by",
          paragraphs: [
            `${legalProfile.legalName} (sole proprietor of “${legalProfile.businessName}”)`,
          ],
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
        {
          title: "Responsible for editorial content per § 18(2) MStV",
          paragraphs: [
            `${legalProfile.legalName}, ${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, ${legalProfile.country}.`,
          ],
        },
        ...(getDataProtectionOfficerParagraphs("en").length
          ? [
              {
                title: "Data Protection Officer",
                paragraphs: getDataProtectionOfficerParagraphs("en"),
              },
            ]
          : []),
        {
          title: "EU online dispute resolution",
          paragraphs: [
            "The European Commission provides a platform for online dispute resolution (ODR), which you can reach at https://ec.europa.eu/consumers/odr/. Our consumer-contact email address is listed under “Contact” above.",
          ],
        },
        {
          title: "Consumer dispute resolution",
          paragraphs: [getDisputeResolutionStatement("en")],
        },
        {
          title: "Liability for content",
          paragraphs: [
            "As a service provider, we are responsible for our own content on these pages under general law per § 7(1) DDG. However, under §§ 8–10 DDG, service providers are not obliged to monitor third-party information that is transmitted or stored, or to investigate circumstances that suggest unlawful activity. Obligations to remove or block the use of information under general law remain unaffected.",
          ],
        },
        {
          title: "Liability for links",
          paragraphs: [
            "Our offering may contain links to external third-party websites whose content we do not control. We therefore cannot accept liability for that third-party content. The respective provider or operator of the linked pages is always responsible for their content. Linked pages are reviewed at the time of linking; upon notification of a legal violation, we will remove such links promptly.",
          ],
        },
        {
          title: "Copyright",
          paragraphs: [
            "Content created by the operator on these pages is subject to German copyright law. Third-party contributions are identified as such. Any duplication, modification, distribution, or commercial use beyond the limits of copyright law requires the prior written consent of the relevant rights holder.",
          ],
        },
      ],
    },
    dpa: {
      title: "Data Processing Agreement",
      description:
        "Data Processing Agreement for Webhealth business customers using connected Google Search Console, Google Analytics 4, crawl, snapshot, and report data.",
      lastUpdatedLabel: "Last updated: May 2026",
      intro: [
        `This Data Processing Agreement (DPA) forms part of the Terms of Service or other principal agreement between a business customer using ${legalProfile.productName} and ${getOperatorDisplayName("en")}.`,
        "It applies only where Webhealth processes personal data on behalf of a business customer as processor under Article 28 GDPR. Webhealth remains an independent controller for account, billing, security, website analytics, product analytics, and support data processed for its own purposes.",
      ],
      sections: [
        {
          title: "Parties and roles",
          paragraphs: [
            "The business customer is the controller for Customer Personal Data submitted to, connected with, or generated from the service. Webhealth acts as processor under Article 28 GDPR for that Customer Personal Data only to the extent required to provide the service.",
            `The processor is ${getOperatorDisplayName("en")}, ${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, ${legalProfile.country}. Privacy and DPA notices may be sent to ${getPrivacyContactEmail()}.`,
          ],
        },
        {
          title: "Subject matter and processing instructions",
          paragraphs: [
            "The customer instructs Webhealth to process Customer Personal Data for the duration of the principal agreement and only as needed to provide, secure, maintain, and support the service.",
            "Webhealth will process Customer Personal Data only on documented instructions from the customer, including the principal agreement, this DPA, the customer's product configuration, and lawful support or deletion requests, unless Union or Member State law requires otherwise.",
          ],
        },
        {
          title: "Service scope",
          bullets: [
            "Connecting and reading Google Search Console and Google Analytics 4 properties authorized by the customer.",
            "Crawling publicly accessible customer websites and storing technical crawl findings.",
            "Creating dashboards, snapshots, share links, exports, deterministic action items, and AI-assisted recommendations.",
            "Operating authentication, access control, support, security monitoring, abuse prevention, backups, and operational logging needed for the service.",
          ],
        },
        {
          title: "Categories of data subjects and personal data",
          bullets: [
            "Data subjects may include customer account users, team members, agency or client contacts, support request senders, and customer website visitors or end users represented in connected GSC or GA4 data.",
            "Personal data may include names, email addresses, profile images, user and team identifiers, IP addresses, user agents, property URLs, page paths, search queries, traffic-source data, country/device metrics, event or session metrics, crawl findings, snapshots, AI prompts and outputs, share-link payloads, support messages, and operational logs.",
            "Customers must not intentionally submit special-category data, criminal-offense data, payment-card data, government identifiers, or similarly sensitive personal data. Webhealth is not designed to process those data categories.",
          ],
        },
        {
          title: "Confidentiality and personnel access",
          paragraphs: [
            "Webhealth will ensure that persons authorized to process Customer Personal Data are bound by confidentiality obligations and access the data only where needed to provide, secure, support, or maintain the service.",
            "Production infrastructure, database access, encryption keys, and administrative tooling are restricted to authorized personnel and protected by strong authentication and access controls.",
          ],
        },
        {
          title: "Security measures",
          bullets: [
            "TLS encryption for data in transit between browsers, application services, processors, and third-party APIs.",
            "AES-256-GCM encryption at rest for Google OAuth access tokens, refresh tokens, and ID tokens before database storage.",
            "EU-hosted self-managed PostgreSQL and worker infrastructure on Hetzner with restricted network exposure, authenticated administrative access, backups, WAL archiving, and operational monitoring.",
            "Error monitoring configured without default PII collection, secret/token redaction for logs, Stripe webhook signature verification, and crawl safeguards that restrict unsafe targets.",
            "Procedures to detect, investigate, mitigate, and respond to personal data breaches affecting Customer Personal Data.",
          ],
        },
        {
          title: "Subprocessors",
          paragraphs: [
            "The customer generally authorizes Webhealth to use subprocessors needed to provide the service. Webhealth will impose data-protection obligations on subprocessors that are materially equivalent to this DPA where the subprocessor processes Customer Personal Data.",
            "Webhealth will publish updates on this page or the related subprocessor section and provide reasonable email or in-product notice for material new subprocessors where practicable. Customers may object on reasonable data-protection grounds before the change takes effect, and the parties will work in good faith on a commercially reasonable resolution.",
          ],
          bullets: [
            "Google: OAuth sign-in, Google Search Console, Google Analytics 4, and Google Analytics website measurement after consent.",
            "Vercel: hosting and delivery of the web application and cookieless Vercel Analytics.",
            "Hetzner: self-managed PostgreSQL database, worker infrastructure, backups, monitoring, and self-hosted services in the EU.",
            "OpenAI: AI-assisted snapshot and recommendation processing and imported OpenAI billing summaries where configured.",
            "Stripe: customer records, subscription processing, billing portal, and transactional billing communications.",
            "PostHog: optional server-side product analytics using the EU instance.",
            "GlitchTip: self-hosted error monitoring on Hetzner infrastructure, without transfer to a third-party hosted GlitchTip service.",
          ],
        },
        {
          title: "International transfers",
          paragraphs: [
            "Some subprocessors may process or make Customer Personal Data accessible outside the EU/EEA, including in the United States. This may apply in particular to Google, OpenAI, Stripe, Vercel, and PostHog depending on the service flow and their subprocessors.",
            "Where required, Webhealth relies on adequacy decisions, the EU-U.S. Data Privacy Framework where applicable, standard contractual clauses, and supplementary safeguards appropriate to the transfer.",
          ],
        },
        {
          title: "Data subject requests and compliance assistance",
          paragraphs: [
            "Taking into account the nature of processing and information available to Webhealth, Webhealth will provide reasonable assistance for customer obligations relating to data subject requests, data protection impact assessments, supervisory authority consultations, and security inquiries.",
            "If Webhealth receives a data subject request relating to Customer Personal Data, Webhealth will notify the customer where legally permitted and will not respond on the customer's behalf except on documented instruction or where legally required.",
          ],
        },
        {
          title: "Personal data breaches",
          paragraphs: [
            "Webhealth will notify the customer without undue delay after becoming aware of a personal data breach affecting Customer Personal Data and will provide information reasonably available to help the customer meet its notification obligations.",
            "Webhealth will take reasonable steps to investigate, mitigate, and remediate such breaches, taking into account the nature of the service and the information available to Webhealth.",
          ],
        },
        {
          title: "Deletion and return",
          paragraphs: [
            "After the end of the service or a valid deletion request, Webhealth will delete active production copies of Customer Personal Data within 30 days unless continued retention is required by law, security, dispute resolution, or legitimate operational needs.",
            "Backup copies are protected against ordinary access and will age out under the normal backup retention cycle unless restoration is required for security, continuity, or legal reasons. If backups are restored, deleted Customer Personal Data will be re-deleted where technically feasible.",
          ],
        },
        {
          title: "Audit rights",
          paragraphs: [
            "Webhealth will make available information reasonably necessary to demonstrate compliance with this DPA, usually through documentation, security summaries, written responses, or equivalent materials.",
            "Direct audits or inspections are available only where legally required, reasonable, scoped to Customer Personal Data, subject to confidentiality, scheduled with reasonable notice, and normally no more than once per calendar year unless a verified personal data breach justifies additional review.",
          ],
        },
        {
          title: "Term, conflict, and governing law",
          paragraphs: [
            "This DPA remains in effect for as long as Webhealth processes Customer Personal Data on behalf of the customer. If this DPA conflicts with the principal agreement, this DPA controls for the processing of Customer Personal Data.",
            `This DPA is governed by German law. For business customers, the courts competent for ${legalProfile.city}, Germany, have jurisdiction to the extent legally permitted.`,
          ],
        },
      ],
    },
  },
} satisfies LegalDictionary;
