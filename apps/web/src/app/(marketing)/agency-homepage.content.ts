import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  FOUNDING_AGENCY_PILOT_LIMIT,
  FOUNDING_AGENCY_PILOT_PRICE_EUR,
  PILOT_BOOKING_URL,
  PUBLIC_PRICING_PLANS,
} from "@/lib/pricing";

type LocalizedText = Record<AgencyLandingLanguage, string>;
type LocalizedTextList = Record<AgencyLandingLanguage, readonly string[]>;
type LocalizedSegments = Record<
  AgencyLandingLanguage,
  [string, string, string?]
>;

export type LandingAvailability = "live" | "preview" | "planned";

export interface AgencyFeatureItem {
  icon: "users" | "bar-chart-2" | "zap" | "palette" | "calendar" | "shield";
  color: string;
  availability: LandingAvailability;
  title: LocalizedText;
  description: LocalizedText;
}

export interface WorkspaceFixItem {
  priority: 1 | 2 | 3;
  title: LocalizedText;
  url: string;
  impact: string;
}

export interface WorkspaceClientCard {
  name: string;
  domain: string;
  initials: string;
  badgeGradient: string;
  status: "healthy" | "attention" | "regression";
  statusLabel: LocalizedText;
  clicks: string;
  clicksDelta: string;
  clicksTrend: "up" | "down";
  ctr: string;
  ctrDelta: string;
  ctrTrend: "up" | "down";
  impressions: string;
  impressionsDelta: string;
  impressionsTrend: "up" | "down";
  position: string;
  positionDelta: string;
  positionTrend: "up" | "down";
  openFixes: number;
  snapshotLabel: LocalizedText;
  fixList: WorkspaceFixItem[];
}

export interface LandingStep {
  number: string;
  color: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface WhiteLabelCheck {
  availability: LandingAvailability;
  title: LocalizedText;
  description: LocalizedText;
}

export interface WhiteLabelKpi {
  label: LocalizedText;
  value: string;
  delta: string;
  trend: "up" | "down";
}

export interface WhiteLabelFixRow {
  priority: 1 | 2 | 3;
  title: LocalizedText;
  meta?: LocalizedText;
}

export interface IntegrationItem {
  icon: "gsc" | "ga4" | "looker" | "crawl";
  availability: LandingAvailability;
  title: LocalizedText;
  description: LocalizedText;
}

export interface ComparisonRow {
  label: LocalizedText;
  manual: LocalizedText;
  webhealth: LocalizedText;
}

export interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface QualificationList {
  title: LocalizedText;
  items: LocalizedTextList;
}

export interface PilotStep {
  number: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface SnapshotProofCard {
  title: LocalizedText;
  description: LocalizedText;
}

export interface PilotOfferFeature {
  title: LocalizedText;
  description: LocalizedText;
}

export const AGENCY_PILOT = {
  bookingUrl: PILOT_BOOKING_URL,
  price: FOUNDING_AGENCY_PILOT_PRICE_EUR,
  limit: FOUNDING_AGENCY_PILOT_LIMIT,
} as const;

export const AGENCY_HOME_COPY = {
  brandSuffix: {
    en: "Agency Pilot",
    de: "Agentur-Pilot",
  },
  nav: {
    workspace: { en: "Workspace", de: "Workspace" },
    demo: { en: "Demo", de: "Demo" },
    whiteLabel: { en: "White-label", de: "White-Label" },
    integrations: { en: "Integrations", de: "Integrationen" },
    pricing: { en: "Pricing", de: "Preise" },
    faq: { en: "FAQ", de: "FAQ" },
    signIn: { en: "Sign in", de: "Anmelden" },
    selfServeCta: { en: "Try for yourself", de: "Loslegen" },
    pilotCta: {
      en: "Book a 12-min pilot fit check",
      de: "12-Minuten Pilot-Check buchen",
    },
    dashboard: { en: "Dashboard", de: "Dashboard" },
    signOut: { en: "Sign out", de: "Abmelden" },
  },
  hero: {
    pill: {
      en: "Founding Agency Pilot",
      de: "Founding Agency Pilot",
    },
    title: {
      en: ["SEO reporting software for agencies that turns ", "reports into actions", "."],
      de: ["SEO Reporting Tool für Agenturen, das ", "Reports in Maßnahmen", " verwandelt."],
    } satisfies LocalizedSegments,
    lead: {
      en: "A founder-led pilot for agencies managing multiple client websites. We connect GSC, GA4, and crawl signals, set up 3-10 client sites, and deliver a branded monthly snapshot plus a ranked action backlog for the next client meeting.",
      de: "Ein founder-led Pilot für DACH-Agenturen, die mehrere Kunden-Websites betreuen. Wir verbinden GSC-, GA4- und Crawl-Signale, richten 3-10 Kunden-Websites ein und liefern einen gebrandeten Monats-Snapshot plus priorisierten Maßnahmen-Backlog für das nächste Kundenmeeting.",
    },
    primaryCta: {
      en: "Book a 12-min pilot fit check",
      de: "12-Minuten Pilot-Check buchen",
    },
    secondaryCta: {
      en: "View demo",
      de: "Demo ansehen",
    },
    notes: {
      en: [
        "First month free",
        "Then EUR 149/month",
        "10 qualified agencies",
        "Founder-led setup",
      ],
      de: [
        "Erster Monat kostenlos",
        "danach 149 EUR/Monat",
        "10 passende Agenturen",
        "Founder-led Setup",
      ],
    } satisfies LocalizedTextList,
    offerTitle: {
      en: "Founding Agency Pilot",
      de: "Founding Agency Pilot",
    },
    offerPrice: {
      en: "First month free, then EUR 149/month",
      de: "Erster Monat kostenlos, danach 149 EUR/Monat",
    },
    offerLimit: {
      en: "Limited to 10 qualified agencies because setup and feedback are founder-led.",
      de: "Limitiert auf 10 Agenturen, weil Setup und Feedback founder-led sind.",
    },
    offerLock: {
      en: "Founding Agencies keep EUR 149/month for 12 months. Later agency prices will be higher.",
      de: "Founding Agencies behalten 149 EUR/Monat für 12 Monate. Spätere Agenturpreise werden höher liegen.",
    },
    exchange: {
      en: "Free pilot month in exchange for honest feedback: one onboarding call, one feedback call, and permission to use anonymized learnings from the pilot.",
      de: "Kostenloser Pilot-Monat gegen ehrliches Feedback: ein Onboarding-Call, ein Feedback-Call und die Erlaubnis, anonymisierte Learnings aus dem Pilot zu verwenden.",
    },
    gridTitle: {
      en: "Pilot deliverable",
      de: "Pilot-Deliverable",
    },
    gridCount: {
      en: "3-10 client sites",
      de: "3-10 Kunden-Websites",
    },
    sparkPrimary: {
      en: "Ranked actions",
      de: "Priorisierte Maßnahmen",
    },
    sparkSecondary: {
      en: "Client-ready monthly snapshot",
      de: "Kundenfertiger Monats-Snapshot",
    },
  },
  features: {
    eyebrow: { en: "Features", de: "Features" },
    title: {
      en: "Not just dashboard access. A usable first agency output.",
      de: "Nicht nur Software-Zugang. Ein nutzbarer erster Agentur-Output.",
    },
    lead: {
      en: "In month one, we set up 3-10 client sites together and deliver a branded SEO monthly snapshot: KPI changes, traffic drops, notable pages, query opportunities, crawl signals, and the next actions to review.",
      de: "Im ersten Monat richten wir gemeinsam 3-10 Kunden-Websites ein und erstellen einen gebrandeten SEO-Monats-Snapshot: KPI-Veränderungen, Traffic-Drops, auffällige Seiten, Query-Chancen, Crawl-Hinweise und die wichtigsten nächsten Maßnahmen für dein Kundenmeeting.",
    },
  },
  qualification: {
    eyebrow: { en: "Fit", de: "Für wen / nicht für wen" },
    title: {
      en: "This pilot intentionally filters.",
      de: "Der Pilot filtert bewusst.",
    },
    lead: {
      en: "The first cohort is for agencies with recurring client-reporting pain, not for one-off site checks or tool replacement shopping.",
      de: "Die erste Kohorte ist für Agenturen mit wiederkehrender Kundenreporting-Arbeit, nicht für einzelne Website-Checks oder Tool-Vergleiche.",
    },
  },
  workspace: {
    eyebrow: { en: "Multi-client workspace", de: "Multi-Client-Workspace" },
    title: {
      en: "All of your clients. One calm cockpit.",
      de: "Alle deine Kunden. Ein ruhiges Cockpit.",
    },
    lead: {
      en: "Review the full portfolio, then drill into one client without leaving the homepage. The dataset below is fictional sample data, but the interaction mirrors the agency workflow this page sells.",
      de: "Prüfe das gesamte Portfolio und springe dann in einen Kunden hinein, ohne die Homepage zu verlassen. Die Daten unten sind fiktive Beispieldaten, aber die Interaktion spiegelt den Agentur-Workflow wider, den diese Seite verkauft.",
    },
    teamLabel: { en: "Team · 4 seats", de: "Team · 4 Plätze" },
    clientsLabel: { en: "Clients", de: "Kunden" },
    portfolioLabel: { en: "Portfolio", de: "Portfolio" },
    addClientLabel: { en: "Add client", de: "Kunde hinzufügen" },
    filters: {
      all: { en: "All · 12", de: "Alle · 12" },
      attention: { en: "Needs attention · 3", de: "Aufmerksam · 3" },
      trend: { en: "Trending up · 7", de: "Im Aufwärtstrend · 7" },
    },
    portfolioTitle: { en: "Portfolio overview", de: "Portfolio-Übersicht" },
    portfolioSubtitle: {
      en: "October 28 · auto-synced 2 hours ago",
      de: "28. Oktober · vor 2 Std. synchronisiert",
    },
    openFixesLabel: { en: "Open fixes", de: "Offene Fixes" },
    openDetailsLabel: { en: "Open details →", de: "Details öffnen →" },
    backLabel: { en: "Back to portfolio", de: "Zurück zum Portfolio" },
    prioritisedFixesLabel: {
      en: "Prioritised fixes",
      de: "Priorisierte Fixes",
    },
    estimatedClicksLabel: {
      en: "Est. clicks/mo",
      de: "Gesch. Klicks/Mon.",
    },
    snapshotPreviewLabel: {
      en: "Marketing preview data",
      de: "Marketing-Preview-Daten",
    },
  },
  how: {
    eyebrow: { en: "How it works", de: "So funktioniert es" },
    title: {
      en: ["From one Google login to ", "ranked fixes in 3 min", "."],
      de: ["Von einem Google-Login zu ", "priorisierten Fixes in 3 Min", "."],
    } satisfies LocalizedSegments,
    lead: {
      en: "The live product already covers the connected-data core. The agency packaging shown here layers on top as planned rollout work.",
      de: "Das Live-Produkt deckt bereits den Kern der verbundenen Daten ab. Das hier gezeigte Agentur-Paket kommt als geplanter Rollout darüber.",
    },
  },
  whiteLabel: {
    eyebrow: { en: "White-label snapshots", de: "White-Label-Snapshots" },
    title: {
      en: "Agency-branded, but not only a report.",
      de: "Im Agentur-Branding, aber nicht nur ein Report.",
    },
    lead: {
      en: "White-label delivery matters for agencies, so the pilot output is a branded monthly snapshot with client-ready summary copy. The core differentiation stays the ranked action layer above the report.",
      de: "White-Label-Delivery ist für Agenturen wichtig, deshalb kommt der Pilot-Output als gebrandeter Monats-Snapshot mit kundenfertiger Zusammenfassung. Die eigentliche Differenzierung bleibt die priorisierte Entscheidungsschicht über dem Report.",
    },
    internalLabel: { en: "Internal", de: "Intern" },
    clientLabel: { en: "Client deliverable", de: "Kunden-Deliverable" },
    internalBrand: { en: "Webhealth", de: "Webhealth" },
    clientBrand: { en: "Your Agency", de: "Deine Agentur" },
    internalSubtitle: {
      en: "Agency working copy",
      de: "Agentur-Arbeitskopie",
    },
    clientSubtitle: {
      en: "Monthly SEO snapshot",
      de: "Monatlicher SEO-Snapshot",
    },
    internalTitle: {
      en: "acme-bakery.de — October review",
      de: "acme-bakery.de — Oktober-Review",
    },
    clientTitle: {
      en: "Acme Bakery — October 2026",
      de: "Acme Bakery — Oktober 2026",
    },
    internalSummary: {
      en: "Internal ranked fix list · dev notes visible",
      de: "Interne Fix-Liste · Dev-Notizen sichtbar",
    },
    clientSummary: {
      en: "Prepared by Your Agency · shared with acme@bakery.de",
      de: "Erstellt von deiner Agentur · geteilt mit acme@bakery.de",
    },
    clientFooter: {
      en: "© 2026 Your Agency · questions? hi@youragency.com",
      de: "© 2026 Deine Agentur · Fragen? hi@youragency.com",
    },
  },
  integrations: {
    eyebrow: { en: "Integrations", de: "Integrationen" },
    title: {
      en: "Works with the data you already have.",
      de: "Arbeitet mit den Daten, die du schon hast.",
    },
    lead: {
      en: "Google data and the site crawl are real product inputs today. Agency export surfaces, like Looker Studio packaging, stay marked as planned.",
      de: "Google-Daten und der Site-Crawl sind heute reale Produkt-Eingaben. Agentur-Exportoberflächen wie das Looker-Studio-Paket bleiben klar als geplant markiert.",
    },
  },
  snapshotProof: {
    eyebrow: { en: "First snapshot", de: "Erster Snapshot" },
    title: {
      en: "What the first snapshot should show.",
      de: "Was der erste Snapshot zeigen soll.",
    },
    lead: {
      en: "No invented results, no fake case studies. The pilot proves whether the connected data becomes a practical client-meeting agenda.",
      de: "Keine erfundenen Ergebnisse, keine Fake-Testimonials. Der Pilot zeigt, ob aus den verbundenen Daten eine brauchbare Agenda für dein Kundenmeeting wird.",
    },
  },
  competitor: {
    eyebrow: { en: "Positioning", de: "Positionierung" },
    title: {
      en: "Not another SEO tool. The decision layer above your reports.",
      de: "Kein Ersatz für deine SEO-Tools. Die Entscheidungsschicht darüber.",
    },
    lead: {
      en: "WebHealth does not replace Ahrefs, Semrush, Screaming Frog or Looker Studio. The pilot tests the step after that: GSC, GA4 and crawl signals become a prioritized action plan you can work through internally or discuss with clients.",
      de: "WebHealth ersetzt nicht Ahrefs, Semrush, Screaming Frog oder Looker Studio. Der Pilot testet den Schritt danach: Aus GSC-, GA4- und Crawl-Signalen entsteht ein priorisierter Maßnahmenplan, den du intern abarbeiten oder mit Kunden besprechen kannst.",
    },
  },
  comparison: {
    eyebrow: {
      en: "Before Webhealth vs. after",
      de: "Vor Webhealth vs. nachher",
    },
    title: {
      en: "The honest math on monthly snapshot work.",
      de: "Die ehrliche Rechnung für Monatssnapshoting.",
    },
    lead: {
      en: 'What a 10-client agency usually spends on exports, formatting, and "what should we do next?" calls.',
      de: 'Was eine 10-Kunden-Agentur typischerweise für Exporte, Formatierung und "Was machen wir als Nächstes?"-Calls bezahlt.',
    },
    manualLabel: { en: "Manual snapshot work", de: "Manuelle Snapshot-Arbeit" },
    webhealthLabel: { en: "With Webhealth", de: "Mit Webhealth" },
  },
  pricing: {
    eyebrow: { en: "Pilot offer", de: "Pilot-Angebot" },
    title: {
      en: "First month free. Then EUR 149/month.",
      de: "Erster Monat kostenlos. Danach 149 EUR/Monat.",
    },
    lead: {
      en: "The recommended agency path is the pilot call, not checkout. Self-serve plans remain available for individual projects or later product use.",
      de: "Der empfohlene Agentur-Weg ist der Pilot-Check, nicht Checkout. Self-Serve-Pläne bleiben für Einzelprojekte oder spätere Produktnutzung verfügbar.",
    },
    finePrint: {
      en: "No Stripe entry is required for the free pilot month. If the workflow is useful after the first monthly snapshot, we send the payment link for the EUR 149/month founder rate.",
      de: "Für den kostenlosen Pilot-Monat ist kein Stripe-Eintrag nötig. Wenn der Workflow nach dem ersten Monats-Snapshot passt, schicken wir den Zahlungslink für den Founder-Preis von 149 EUR/Monat.",
    },
    agencySitesLabel: { en: "Client sites", de: "Kunden-Sites" },
    agencyPreviewLabel: {
      en: "Self-serve option",
      de: "Self-Serve-Option",
    },
    selfServeLabel: {
      en: "For individual projects or later self-serve use",
      de: "Für Einzelprojekte oder spätere Self-Serve-Nutzung",
    },
  },
  faq: {
    eyebrow: { en: "FAQ", de: "FAQ" },
    title: {
      en: "Before you connect.",
      de: "Bevor du verbindest.",
    },
  },
  closingCta: {
    title: {
      en: "Turn the next monthly report into an action plan.",
      de: "Mach aus dem nächsten Monatsreport einen Maßnahmenplan.",
    },
    subtitle: {
      en: "Book the pilot fit check. We set up the first 1-3 client pages together and turn the workflow into something usable for your next client update.",
      de: "Buche den Pilot-Check. Wir richten gemeinsam die ersten 1-3 Kundenseiten ein und machen den Workflow für dein nächstes Kunden-Update nutzbar.",
    },
    primaryCta: {
      en: "Book a 12-min pilot fit check",
      de: "12-Minuten Pilot-Check buchen",
    },
    secondaryCta: {
      en: "Try for yourself",
      de: "Loslegen",
    },
    notes: {
      en: ["First month free", "10 agencies", "Founder-led setup"],
      de: ["Erster Monat kostenlos", "10 Agenturen", "Founder-led Setup"],
    } satisfies LocalizedTextList,
  },
  footer: {
    pricing: { en: "Pricing", de: "Preise" },
    contact: { en: "Contact", de: "Kontakt" },
    rights: {
      en: "All rights reserved.",
      de: "Alle Rechte vorbehalten.",
    },
  },
} as const;

export const AGENCY_QUALIFICATION: QualificationList[] = [
  {
    title: { en: "The pilot fits if ...", de: "Der Pilot passt, wenn ..." },
    items: {
      en: [
        "you manage at least 5 active client websites",
        "you already have access to your clients' GSC and GA4 properties",
        "you create monthly SEO updates, reports, or client emails",
        "you do not only want to show data, but need concrete next actions",
        "you are willing to give honest feedback in 2 short calls",
      ],
      de: [
        "du mindestens 5 aktive Kunden-Websites betreust",
        "du bereits Zugriff auf GSC und GA4 deiner Kunden hast",
        "du monatlich SEO-Updates, Reports oder Kunden-Mails erstellst",
        "du nicht nur Daten zeigen willst, sondern konkrete nächste Maßnahmen brauchst",
        "du bereit bist, in 2 kurzen Calls ehrliches Feedback zu geben",
      ],
    },
  },
  {
    title: { en: "The pilot does not fit if ...", de: "Der Pilot passt nicht, wenn ..." },
    items: {
      en: [
        "you only want to check one individual website",
        "you are looking for an Ahrefs, Semrush, or Screaming Frog replacement",
        "you expect fully automated SEO decisions without review",
        "you do not have an agency, freelance, or client-reporting situation",
      ],
      de: [
        "du nur eine einzelne Website prüfen willst",
        "du einen Ahrefs-, Semrush- oder Screaming-Frog-Ersatz suchst",
        "du vollautomatische SEO-Entscheidungen ohne Prüfung erwartest",
        "du keine Agentur-, Freelancer- oder Kundenreporting-Situation hast",
      ],
    },
  },
];

export const AGENCY_PILOT_STEPS: PilotStep[] = [
  {
    number: "1",
    title: { en: "12-min pilot fit check", de: "12-Minuten Pilot-Check" },
    description: {
      en: "We confirm whether your client-reporting workflow is a fit before setup starts.",
      de: "Wir prüfen kurz, ob dein Kundenreporting-Workflow wirklich zum Pilot passt.",
    },
  },
  {
    number: "2",
    title: { en: "Pick 3-10 client sites", de: "3-10 Kunden-Websites auswählen" },
    description: {
      en: "You choose the client sites where GSC, GA4, and crawl signals should become useful work.",
      de: "Du wählst die Kunden-Websites, bei denen aus GSC, GA4 und Crawl-Signalen echte Arbeit werden soll.",
    },
  },
  {
    number: "3",
    title: {
      en: "Get the first monthly snapshot and ranked backlog",
      de: "Ersten Monats-Snapshot + Maßnahmen-Backlog erhalten",
    },
    description: {
      en: "You receive a client-ready snapshot plus the internal actions to review next.",
      de: "Du erhältst einen kundenfertigen Snapshot plus die internen Maßnahmen, die als Nächstes geprüft werden sollten.",
    },
  },
];

export const AGENCY_SNAPSHOT_PROOF_CARDS: SnapshotProofCard[] = [
  {
    title: { en: "Which pages lost?", de: "Welche Seiten haben verloren?" },
    description: {
      en: "Spot traffic drops and the supporting analytics context without claiming one magic cause.",
      de: "Traffic-Drops und Analytics-Kontext sehen, ohne eine einzelne magische Ursache zu behaupten.",
    },
  },
  {
    title: {
      en: "Which queries are close to better positions?",
      de: "Welche Queries sind nah an besseren Positionen?",
    },
    description: {
      en: "Find near-win queries and CTR gaps that deserve review in the next client cycle.",
      de: "Near-Win-Queries und CTR-Lücken finden, die in den nächsten Kundenzyklus gehören.",
    },
  },
  {
    title: {
      en: "Which technical issues support the priority?",
      de: "Welche technischen Probleme stützen die Priorität?",
    },
    description: {
      en: "Connect traffic drops with supporting crawl, content, and analytics signals.",
      de: "Traffic-Drops mit Crawl-, Content- und Analytics-Signalen verbinden.",
    },
  },
  {
    title: {
      en: "Which 3-5 actions belong in this week's client meeting?",
      de: "Welche 3-5 Maßnahmen gehören diese Woche ins Kundenmeeting?",
    },
    description: {
      en: "Turn evidence-backed recommendations into a ranked action backlog.",
      de: "Aus evidence-backed Recommendations wird ein priorisierter Maßnahmen-Backlog.",
    },
  },
];

export const AGENCY_FEATURES: AgencyFeatureItem[] = [
  {
    icon: "users",
    color: "#6366f1",
    availability: "live",
    title: {
      en: "3-10 client sites set up with you.",
      de: "3-10 Kunden-Websites gemeinsam einrichten.",
    },
    description: {
      en: "Founder-led onboarding helps you pick the right properties and turn access into a usable first workflow.",
      de: "Founder-led Onboarding hilft dir, die richtigen Properties auszuwählen und aus Zugriff einen nutzbaren ersten Workflow zu machen.",
    },
  },
  {
    icon: "bar-chart-2",
    color: "#0ea5e9",
    availability: "live",
    title: {
      en: "A branded monthly snapshot.",
      de: "Ein gebrandeter Monats-Snapshot.",
    },
    description: {
      en: "KPI changes, traffic drops, notable pages, query opportunities, and crawl signals are packaged for the client update.",
      de: "KPI-Veränderungen, Traffic-Drops, auffällige Seiten, Query-Chancen und Crawl-Hinweise werden für das Kunden-Update gebündelt.",
    },
  },
  {
    icon: "zap",
    color: "#f59e0b",
    availability: "live",
    title: {
      en: "A ranked action backlog.",
      de: "Ein priorisierter Maßnahmen-Backlog.",
    },
    description: {
      en: "WebHealth surfaces likely causes and the next actions to review, using evidence-backed GSC, GA4, and crawl signals.",
      de: "WebHealth macht wahrscheinliche Ursachen und nächste Maßnahmen sichtbar, gestützt durch GSC-, GA4- und Crawl-Signale.",
    },
  },
  {
    icon: "palette",
    color: "#10b981",
    availability: "preview",
    title: {
      en: "White-label delivery in the pilot.",
      de: "White-Label-Delivery im Pilot.",
    },
    description: {
      en: "The first output is agency-branded and client-ready, without making white-label the whole product story.",
      de: "Der erste Output ist im Agentur-Branding und kundenfertig, ohne White-Label zur ganzen Produktstory zu machen.",
    },
  },
  {
    icon: "calendar",
    color: "#06b6d4",
    availability: "planned",
    title: {
      en: "Schedules, not spreadsheets.",
      de: "Zeitpläne statt Tabellen.",
    },
    description: {
      en: "Scheduled agency delivery is planned. The homepage keeps it visible as a roadmap promise rather than hiding the intended operating model.",
      de: "Geplante Agentur-Auslieferung ist vorgesehen. Die Homepage zeigt das bewusst als Roadmap-Versprechen statt das beabsichtigte Betriebsmodell zu verstecken.",
    },
  },
  {
    icon: "shield",
    color: "#f43f5e",
    availability: "live",
    title: {
      en: "Germany-hosted data core. Agency controls staged.",
      de: "Datenhosting in Deutschland. Agentur-Kontrollen gestuft.",
    },
    description: {
      en: "The connected-data core runs in Germany on servers from a local hosting provider. Granular client permissions and SSO stay clearly labeled as follow-up product work.",
      de: "Der verbundene Datenkern läuft in Deutschland auf Servern eines lokalen Hosting-Providers. Granulare Kundenrechte und SSO bleiben klar als nachgelagerte Produktarbeit markiert.",
    },
  },
];

export const AGENCY_WORKSPACE_CLIENTS: WorkspaceClientCard[] = [
  {
    name: "Acme Bakery",
    domain: "acme-bakery.de",
    initials: "A",
    badgeGradient: "linear-gradient(135deg,#6366f1,#0ea5e9)",
    status: "healthy",
    statusLabel: { en: "Healthy", de: "Gesund" },
    clicks: "4,218",
    clicksDelta: "+12.3%",
    clicksTrend: "up",
    ctr: "2.97%",
    ctrDelta: "+0.4pt",
    ctrTrend: "up",
    impressions: "142K",
    impressionsDelta: "+8.1%",
    impressionsTrend: "up",
    position: "18.4",
    positionDelta: "-1.2",
    positionTrend: "down",
    openFixes: 5,
    snapshotLabel: {
      en: "Last snapshot · 2h ago",
      de: "Letzter Snapshot · vor 2h",
    },
    fixList: [
      {
        priority: 1,
        title: {
          en: "Missing meta description on /blog/seo-tips",
          de: "Meta-Beschreibung fehlt auf /blog/seo-tipps",
        },
        url: "acme-bakery.de/blog/seo-tips",
        impact: "+820",
      },
      {
        priority: 1,
        title: {
          en: "Duplicate H1 on /services",
          de: "Doppelte H1 auf /services",
        },
        url: "acme-bakery.de/services",
        impact: "+410",
      },
      {
        priority: 2,
        title: {
          en: "Slow LCP on /products (5.2s)",
          de: "Langsamer LCP auf /products (5,2s)",
        },
        url: "acme-bakery.de/products",
        impact: "+240",
      },
    ],
  },
  {
    name: "Leaf Studio",
    domain: "leaf-studio.co",
    initials: "L",
    badgeGradient: "linear-gradient(135deg,#10b981,#06b6d4)",
    status: "healthy",
    statusLabel: { en: "Healthy", de: "Gesund" },
    clicks: "18,420",
    clicksDelta: "+24%",
    clicksTrend: "up",
    ctr: "3.14%",
    ctrDelta: "+0.6pt",
    ctrTrend: "up",
    impressions: "586K",
    impressionsDelta: "+18%",
    impressionsTrend: "up",
    position: "11.2",
    positionDelta: "+2.4",
    positionTrend: "up",
    openFixes: 3,
    snapshotLabel: {
      en: "Last snapshot · today",
      de: "Letzter Snapshot · heute",
    },
    fixList: [
      {
        priority: 1,
        title: {
          en: "Canonical tag mismatch on /work",
          de: "Canonical-Fehler auf /work",
        },
        url: "leaf-studio.co/work",
        impact: "+640",
      },
      {
        priority: 2,
        title: {
          en: "Large unoptimized hero image",
          de: "Zu großes Hero-Bild",
        },
        url: "leaf-studio.co/",
        impact: "+210",
      },
      {
        priority: 3,
        title: {
          en: "Sitemap missing /case-studies",
          de: "Sitemap ohne /case-studies",
        },
        url: "leaf-studio.co/sitemap.xml",
        impact: "+120",
      },
    ],
  },
  {
    name: "Schmidt Steuer",
    domain: "schmidt-steuer.at",
    initials: "S",
    badgeGradient: "linear-gradient(135deg,#f59e0b,#f43f5e)",
    status: "attention",
    statusLabel: { en: "Needs attention", de: "Aufmerksam" },
    clicks: "2,940",
    clicksDelta: "-4.2%",
    clicksTrend: "down",
    ctr: "1.82%",
    ctrDelta: "-0.3pt",
    ctrTrend: "down",
    impressions: "161K",
    impressionsDelta: "-2.1%",
    impressionsTrend: "down",
    position: "22.8",
    positionDelta: "-3.1",
    positionTrend: "down",
    openFixes: 7,
    snapshotLabel: {
      en: "Last snapshot · yesterday",
      de: "Letzter Snapshot · gestern",
    },
    fixList: [
      {
        priority: 1,
        title: {
          en: "Title tag over 60 chars on /ueber",
          de: "Title-Tag über 60 Zeichen auf /ueber",
        },
        url: "schmidt-steuer.at/ueber",
        impact: "+280",
      },
      {
        priority: 1,
        title: {
          en: "Thin content on /leistungen",
          de: "Thin Content auf /leistungen",
        },
        url: "schmidt-steuer.at/leistungen",
        impact: "+260",
      },
      {
        priority: 2,
        title: {
          en: "Image alt missing on /team",
          de: "Alt-Text fehlt auf /team",
        },
        url: "schmidt-steuer.at/team",
        impact: "+90",
      },
    ],
  },
  {
    name: "Nordlicht Reisen",
    domain: "nordlicht-reisen.de",
    initials: "N",
    badgeGradient: "linear-gradient(135deg,#06b6d4,#6366f1)",
    status: "healthy",
    statusLabel: { en: "Healthy", de: "Gesund" },
    clicks: "8,120",
    clicksDelta: "+6.4%",
    clicksTrend: "up",
    ctr: "2.34%",
    ctrDelta: "+0.2pt",
    ctrTrend: "up",
    impressions: "347K",
    impressionsDelta: "+4.8%",
    impressionsTrend: "up",
    position: "15.7",
    positionDelta: "+0.4",
    positionTrend: "up",
    openFixes: 4,
    snapshotLabel: {
      en: "Last snapshot · 3d ago",
      de: "Letzter Snapshot · vor 3 T.",
    },
    fixList: [
      {
        priority: 2,
        title: {
          en: "Schema.org TouristTrip missing",
          de: "Schema.org TouristTrip fehlt",
        },
        url: "nordlicht-reisen.de/touren",
        impact: "+310",
      },
      {
        priority: 2,
        title: {
          en: "Hreflang EN/DE inconsistent",
          de: "Hreflang EN/DE inkonsistent",
        },
        url: "nordlicht-reisen.de/",
        impact: "+180",
      },
      {
        priority: 3,
        title: {
          en: "404 on legacy /reise-2023",
          de: "404 auf /reise-2023",
        },
        url: "nordlicht-reisen.de/reise-2023",
        impact: "+45",
      },
    ],
  },
];

export const AGENCY_STEPS: LandingStep[] = [
  {
    number: "01",
    color: "#6366f1",
    title: {
      en: "Sign in with your agency Google account",
      de: "Mit deinem Agentur-Google-Konto anmelden",
    },
    description: {
      en: "One OAuth grant. Webhealth discovers every GSC and GA4 property your team can already read.",
      de: "Ein OAuth-Grant. Webhealth entdeckt jede GSC- und GA4-Property, die dein Team bereits lesen darf.",
    },
  },
  {
    number: "02",
    color: "#0ea5e9",
    title: {
      en: "Review clients from one homepage workspace",
      de: "Kunden aus einem Homepage-Workspace prüfen",
    },
    description: {
      en: "The interactive workspace below previews the portfolio flow the agency offering is built around.",
      de: "Der interaktive Workspace unten zeigt den Portfolio-Flow, um den das Agentur-Angebot gebaut wird.",
    },
  },
  {
    number: "03",
    color: "#10b981",
    title: {
      en: "Layer on agency packaging as it rolls out",
      de: "Agentur-Paket schrittweise darüberlegen",
    },
    description: {
      en: "White-label delivery, agency pricing, and advanced controls are visible here as the rollout target and documented in the follow-up note.",
      de: "White-Label-Deliverables, Agentur-Preise und erweiterte Kontrollen sind hier als Rollout-Ziel sichtbar und in der Follow-up-Notiz dokumentiert.",
    },
  },
];

export const AGENCY_WHITE_LABEL_CHECKS: WhiteLabelCheck[] = [
  {
    availability: "preview",
    title: {
      en: "Your logo, your colors, your domain.",
      de: "Dein Logo, deine Farben, deine Domain.",
    },
    description: {
      en: "Upload a logo, pick an accent, set a snapshot subdomain (snapshots.youragency.com).",
      de: "Lade ein Logo hoch, wähle einen Akzent, setze eine Snapshot-Subdomain (snapshots.deineagentur.de).",
    },
  },
  {
    availability: "preview",
    title: {
      en: "Plain language for clients.",
      de: "Klare Sprache für Kunden.",
    },
    description: {
      en: "The client copy strips technical jargon. No CSS selectors, no CLS numbers — just priorities and business impact.",
      de: "Die Kunden-Version streicht technischen Jargon. Keine CSS-Selektoren, keine CLS-Zahlen — nur Prioritäten und Business-Impact.",
    },
  },
  {
    availability: "planned",
    title: {
      en: "PDF, link, or scheduled send.",
      de: "PDF, Link oder geplanter Versand.",
    },
    description: {
      en: "Send a branded PDF, a shareable link, or auto-email on the 1st of every month.",
      de: "Sende ein gebrandetes PDF, einen teilbaren Link oder eine automatische E-Mail am 1. jedes Monats.",
    },
  },
];

export const WHITE_LABEL_KPIS: WhiteLabelKpi[] = [
  {
    label: { en: "Clicks", de: "Klicks" },
    value: "4,218",
    delta: "+12.3%",
    trend: "up",
  },
  {
    label: { en: "CTR", de: "CTR" },
    value: "2.97%",
    delta: "+0.4pt",
    trend: "up",
  },
  {
    label: { en: "Pos.", de: "Pos." },
    value: "18.4",
    delta: "-1.2",
    trend: "down",
  },
];

export const WHITE_LABEL_INTERNAL_FIXES: WhiteLabelFixRow[] = [
  {
    priority: 1,
    title: {
      en: "Missing meta — /blog/seo-tips",
      de: "Meta fehlt — /blog/seo-tipps",
    },
    meta: {
      en: "dev: Next.js layout.tsx",
      de: "dev: Next.js layout.tsx",
    },
  },
  {
    priority: 2,
    title: {
      en: "Duplicate H1 on /services",
      de: "Doppelte H1 auf /services",
    },
    meta: {
      en: "dev: components/hero",
      de: "dev: components/hero",
    },
  },
  {
    priority: 3,
    title: {
      en: "Broken internal link",
      de: "Defekter interner Link",
    },
    meta: {
      en: "dev: /blog/2022",
      de: "dev: /blog/2022",
    },
  },
];

export const WHITE_LABEL_CLIENT_FIXES: WhiteLabelFixRow[] = [
  {
    priority: 1,
    title: {
      en: "Homepage metadata refresh",
      de: "Startseiten-Metadaten auffrischen",
    },
  },
  {
    priority: 2,
    title: {
      en: "Services page structure",
      de: "Services-Seitenstruktur",
    },
  },
  {
    priority: 3,
    title: {
      en: "Legacy link cleanup",
      de: "Legacy-Link-Bereinigung",
    },
  },
];

export const AGENCY_INTEGRATIONS: IntegrationItem[] = [
  {
    icon: "gsc",
    availability: "live",
    title: { en: "Google Search Console", de: "Google Search Console" },
    description: {
      en: "Clicks, impressions, CTR, and position by page and query across the properties your Google account already has access to.",
      de: "Klicks, Impressionen, CTR und Position nach Seite und Query über die Properties, auf die dein Google-Konto bereits Zugriff hat.",
    },
  },
  {
    icon: "ga4",
    availability: "live",
    title: { en: "Google Analytics 4", de: "Google Analytics 4" },
    description: {
      en: "Sessions and users layered onto the same snapshot so traffic changes map back to commercial pages and supporting content.",
      de: "Sessions und Nutzer im selben Snapshot, damit Traffic-Veränderungen auf kommerzielle Seiten und unterstützende Inhalte zurückgeführt werden können.",
    },
  },
  {
    icon: "looker",
    availability: "planned",
    title: { en: "Looker Studio Export", de: "Looker-Studio-Export" },
    description: {
      en: "Looker export is part of the agency roadmap presented here. It is intentionally labeled as planned until the product surface exists.",
      de: "Der Looker-Export ist Teil der hier gezeigten Agentur-Roadmap. Er ist bewusst als geplant markiert, bis die Produktoberfläche existiert.",
    },
  },
  {
    icon: "crawl",
    availability: "live",
    title: { en: "Live site crawl", de: "Live-Site-Crawl" },
    description: {
      en: "Fresh crawl input on every snapshot: broken H1s, 4xx links, missing meta, and other technical issues fed into the ranked list.",
      de: "Frische Crawl-Eingaben in jedem Snapshot: kaputte H1s, 4xx-Links, fehlende Meta-Daten und andere technische Probleme fließen in die priorisierte Liste ein.",
    },
  },
];

export const AGENCY_COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: {
      en: "Typical time per client / month",
      de: "Typische Zeit pro Kunde / Monat",
    },
    manual: {
      en: "3–5 hours pulling GSC + GA4 data, formatting slides",
      de: "3–5 Stunden GSC- + GA4-Daten ziehen, Slides bauen",
    },
    webhealth: {
      en: "3 minutes — scheduled, automated",
      de: "3 Minuten — geplant, automatisiert",
    },
  },
  {
    label: {
      en: "Data sources stitched",
      de: "Zusammengesetzte Datenquellen",
    },
    manual: {
      en: "GSC export, GA4 export, crawl tool, Looker by hand",
      de: "GSC-Export, GA4-Export, Crawl-Tool, Looker manuell",
    },
    webhealth: {
      en: "GSC + GA4 + live crawl joined for you",
      de: "GSC + GA4 + Live-Crawl verbunden",
    },
  },
  {
    label: {
      en: "Ranked 'what to do next'",
      de: 'Priorisiertes "Was als Nächstes?"',
    },
    manual: {
      en: "Written from memory after each call",
      de: "Aus dem Gedächtnis nach jedem Call",
    },
    webhealth: {
      en: "Prioritized P1/P2/P3 with URLs and impact",
      de: "Priorisiert P1/P2/P3 mit URLs und Impact",
    },
  },
  {
    label: {
      en: "Client-ready output",
      de: "Kundenfertige Ausgabe",
    },
    manual: {
      en: "Cleaned slides, 1 per deliverable",
      de: "Bereinigte Slides, 1 pro Lieferobjekt",
    },
    webhealth: {
      en: "Branded PDF or link, per client, on a schedule",
      de: "Gebrandetes PDF oder Link, pro Kunde, geplant",
    },
  },
  {
    label: {
      en: "Regressions surfaced",
      de: "Rückgänge erkennen",
    },
    manual: {
      en: "When someone eyeballs the line chart",
      de: "Wenn jemand das Liniendiagramm prüft",
    },
    webhealth: {
      en: "Flagged automatically with signed deltas",
      de: "Automatisch mit Delta-Vorzeichen markiert",
    },
  },
  {
    label: {
      en: "Onboarding a new client",
      de: "Neuen Kunden onboarden",
    },
    manual: {
      en: "~30 minutes of admin per property",
      de: "~30 Min. Admin pro Property",
    },
    webhealth: {
      en: "2 clicks — property already discovered via Google",
      de: "2 Klicks — Property schon via Google erkannt",
    },
  },
];

export const AGENCY_PRICING_PLANS = PUBLIC_PRICING_PLANS;

export const AGENCY_FAQ_ITEMS: FaqItem[] = [
  {
    question: {
      en: "Do agencies pay before the first month?",
      de: "Zahlen Agenturen vor dem ersten Monat?",
    },
    answer: {
      en: "No. The first month of the Founding Agency Pilot is free for qualified agencies. If the workflow is useful after the first monthly snapshot, we send the payment link for the EUR 149/month founder rate.",
      de: "Nein. Der erste Monat im Founding Agency Pilot ist für passende Agenturen kostenlos. Wenn der Workflow nach dem ersten Monats-Snapshot passt, schicken wir den Zahlungslink für den Founder-Preis von 149 EUR/Monat.",
    },
  },
  {
    question: {
      en: "What exactly is white-label here?",
      de: "Was bedeutet White-Label hier genau?",
    },
    answer: {
      en: "In the pilot, the first deliverable is an agency-branded monthly snapshot with client-ready summary copy. White-label is visible because agencies need it, but the pilot is mainly about turning data into a ranked action plan.",
      de: "Im Pilot ist der erste Deliverable ein Monats-Snapshot im Agentur-Branding mit kundenfertiger Zusammenfassung. White-Label ist sichtbar, weil Agenturen es brauchen, aber der Pilot dreht sich vor allem darum, aus Daten einen priorisierten Maßnahmenplan zu machen.",
    },
  },
  {
    question: {
      en: "Is this GDPR-compliant and EU-hosted?",
      de: "Ist das DSGVO-konform und EU-gehostet?",
    },
    answer: {
      en: "The core connected-data flow is positioned as EU-hosted. Any extra agency controls that still need implementation are tracked separately in the follow-up note.",
      de: "Der Kernfluss für verbundene Daten ist als EU-gehostet positioniert. Zusätzliche Agentur-Kontrollen, die noch Umsetzung brauchen, werden separat in der Follow-up-Notiz verfolgt.",
    },
  },
  {
    question: {
      en: "Does WebHealth replace Ahrefs, Semrush, or Screaming Frog?",
      de: "Ersetzt WebHealth Ahrefs, Semrush oder Screaming Frog?",
    },
    answer: {
      en: "No. WebHealth sits above the reports and tools you already use. It connects GSC, GA4, and crawl signals into evidence-backed recommendations and a ranked action backlog.",
      de: "Nein. WebHealth sitzt über den Reports und Tools, die du bereits nutzt. Es verbindet GSC-, GA4- und Crawl-Signale zu evidence-backed Recommendations und einem priorisierten Maßnahmen-Backlog.",
    },
  },
];

export const AGENCY_TOPIC_FAQ_ITEMS: FaqItem[] = [
  {
    question: {
      en: "How is WebHealth different from Looker Studio?",
      de: "Wie unterscheidet sich WebHealth von Looker Studio?",
    },
    answer: {
      en: "Looker Studio is useful for dashboards and recurring views. WebHealth is the decision layer above GSC, GA4, and crawl signals: it highlights what changed and turns it into a ranked action backlog for review.",
      de: "Looker Studio ist hilfreich für Dashboards und wiederkehrende Ansichten. WebHealth ist die Entscheidungsschicht über GSC, GA4 und Crawl-Signalen: Es zeigt, was sich verändert hat, und macht daraus einen priorisierten Maßnahmen-Backlog zur Prüfung.",
    },
  },
  {
    question: {
      en: "How often is a monthly SEO snapshot generated?",
      de: "Wie oft wird ein Monats-Snapshot generiert?",
    },
    answer: {
      en: "The pilot is built around one monthly snapshot per connected client site. Early pilot delivery is founder-led, while scheduled automated delivery remains a visible rollout target.",
      de: "Der Pilot ist auf einen Monats-Snapshot pro verbundener Kunden-Website ausgelegt. Die frühe Pilot-Auslieferung ist founder-led; geplante automatische Auslieferung bleibt als Rollout-Ziel sichtbar.",
    },
  },
  {
    question: {
      en: "Which Search Console properties are supported?",
      de: "Welche Search-Console-Properties werden unterstützt?",
    },
    answer: {
      en: "WebHealth works with the Google properties your connected account can read. The product already handles the agency flow around discovered GSC and GA4 properties; edge cases are reviewed during pilot setup.",
      de: "WebHealth arbeitet mit den Google-Properties, die dein verbundenes Konto lesen darf. Der Agenturfluss rund um erkannte GSC- und GA4-Properties ist bereits angelegt; Sonderfälle prüfen wir im Pilot-Setup.",
    },
  },
  {
    question: {
      en: "Can I manage several clients separately?",
      de: "Kann ich mehrere Kunden getrennt verwalten?",
    },
    answer: {
      en: "Yes, the agency pilot is designed for multiple client sites in one workspace. Granular per-client permissions are still labeled as follow-up product work, not as a finished control surface.",
      de: "Ja, der Agentur-Pilot ist für mehrere Kunden-Websites in einem Workspace gedacht. Granulare Rechte pro Kunde sind weiterhin klar als nachgelagerte Produktarbeit markiert, nicht als fertige Kontrollfläche.",
    },
  },
  {
    question: {
      en: "Is customer data hosted in the EU?",
      de: "Werden Kundendaten in der EU gehostet?",
    },
    answer: {
      en: "The connected-data core is positioned as Germany-hosted on a local hosting provider. The legal pages describe processing details and subprocessors.",
      de: "Der verbundene Datenkern ist als in Deutschland gehostet positioniert, auf Infrastruktur eines lokalen Hosting-Providers. Die Legal Pages beschreiben Verarbeitung und Subprozessoren.",
    },
  },
  {
    question: {
      en: "How much setup time does each client site need?",
      de: "Wie viel Setup-Zeit braucht eine Kunden-Website?",
    },
    answer: {
      en: "The pilot starts with a short fit check and founder-led setup for 3-10 client sites. Property selection is intentionally reviewed with you so the first monthly snapshot is useful, not just connected.",
      de: "Der Pilot startet mit einem kurzen Fit-Check und founder-led Setup für 3-10 Kunden-Websites. Die Property-Auswahl prüfen wir bewusst gemeinsam, damit der erste Monats-Snapshot nützlich ist und nicht nur verbunden.",
    },
  },
];
