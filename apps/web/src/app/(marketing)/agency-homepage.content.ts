import type { AgencyLandingLanguage } from "./agency-homepage.logic";

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
  reportLabel: LocalizedText;
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

export interface PricingPlan {
  tier: "solo" | "starter" | "studio" | "agency";
  highlight: boolean;
  badge?: LocalizedText;
  name: LocalizedText;
  description: LocalizedText;
  price: LocalizedText;
  period: LocalizedText;
  cta: LocalizedText;
  features: LocalizedText[];
  note?: LocalizedText;
}

export interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export const AGENCY_HOME_COPY = {
  brandSuffix: {
    en: "for Agencies",
    de: "für Agenturen",
  },
  nav: {
    workspace: { en: "Workspace", de: "Workspace" },
    whiteLabel: { en: "White-label", de: "White-Label" },
    integrations: { en: "Integrations", de: "Integrationen" },
    pricing: { en: "Pricing", de: "Preise" },
    faq: { en: "FAQ", de: "FAQ" },
    signIn: { en: "Sign in with Google", de: "Mit Google anmelden" },
    dashboard: { en: "Dashboard", de: "Dashboard" },
    signOut: { en: "Sign out", de: "Abmelden" },
  },
  hero: {
    pill: {
      en: "Agency beta · Free for one site",
      de: "Agentur-Beta · Kostenlos für eine Website",
    },
    title: {
      en: ["Stop rebuilding the ", "same monthly report", "."],
      de: ["Baue nicht jeden Monat wieder ", "denselben Report", "."],
    } satisfies LocalizedSegments,
    lead: {
      en: "Connect one agency Google login and review every client from a single workspace. Webhealth combines GSC, GA4, and crawl data into ranked next steps, while planned agency delivery features stay clearly marked as preview.",
      de: "Verbinde ein Agentur-Google-Login und prüfe jeden Kunden in einem Workspace. Webhealth führt GSC-, GA4- und Crawl-Daten zu priorisierten nächsten Schritten zusammen, während geplante Agentur-Features klar als Preview markiert bleiben.",
    },
    primaryCta: {
      en: "Connect your Google Workspace",
      de: "Google Workspace verbinden",
    },
    secondaryCta: {
      en: "Jump to workspace",
      de: "Zum Workspace springen",
    },
    notes: {
      en: ["No credit card", "2-minute setup", "Agency workflow preview"],
      de: ["Keine Kreditkarte", "2-Minuten-Setup", "Agentur-Workflow als Preview"],
    } satisfies LocalizedTextList,
    gridTitle: {
      en: "Your client portfolio",
      de: "Dein Kunden-Portfolio",
    },
    gridCount: {
      en: "12 clients",
      de: "12 Kunden",
    },
    sparkPrimary: {
      en: "AI-ranked fixes",
      de: "KI-priorisierte Fixes",
    },
    sparkSecondary: {
      en: "Agency-ready workspace",
      de: "Agentur-tauglicher Workspace",
    },
  },
  features: {
    eyebrow: { en: "Features", de: "Features" },
    title: {
      en: "Everything an agency workflow needs.",
      de: "Alles, was ein Agentur-Workflow braucht.",
    },
    lead: {
      en: "Built for the reporting work you would rather not rebuild by hand, and honest about which agency extras are still in preview.",
      de: "Gebaut für Reporting-Arbeit, die du nicht mehr per Hand zusammenbauen willst, und ehrlich darüber, welche Agentur-Extras noch Preview sind.",
    },
  },
  workspace: {
    eyebrow: { en: "Multi-client workspace", de: "Multi-Client-Workspace" },
    title: {
      en: "All of your clients. One calm cockpit.",
      de: "Alle deine Kunden. Ein ruhiges Cockpit.",
    },
    lead: {
      en: "Review the full portfolio, then drill into one client without leaving the homepage. The dataset below is marketing demo data, but the interaction mirrors the agency workflow this page sells.",
      de: "Prüfe das gesamte Portfolio und springe dann in einen Kunden hinein, ohne die Homepage zu verlassen. Die Daten unten sind Marketing-Demo-Daten, aber die Interaktion spiegelt den Agentur-Workflow wider, den diese Seite verkauft.",
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
    reportPreviewLabel: {
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
    eyebrow: { en: "White-label reports", de: "White-Label-Reports" },
    title: {
      en: "Two reports from one run.",
      de: "Zwei Reports aus einem Lauf.",
    },
    lead: {
      en: "Every report generates twice. One internal copy for your team — with raw data, AI dev notes, and crawl details. One branded copy for your client — your logo, your colors, plain-language recommendations.",
      de: "Jeder Report wird doppelt erstellt. Eine interne Version für dein Team — mit Rohdaten, KI-Dev-Notizen und Crawl-Details. Eine gebrandete Version für deinen Kunden — dein Logo, deine Farben, klare Sprache.",
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
      en: "Monthly SEO report",
      de: "Monatlicher SEO-Report",
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
  comparison: {
    eyebrow: {
      en: "Before Webhealth vs. after",
      de: "Vor Webhealth vs. nachher",
    },
    title: {
      en: "The honest math on monthly reporting.",
      de: "Die ehrliche Rechnung für Monatsreporting.",
    },
    lead: {
      en: 'What a 10-client agency usually spends on exports, formatting, and "what should we do next?" calls.',
      de: 'Was eine 10-Kunden-Agentur typischerweise für Exporte, Formatierung und "Was machen wir als Nächstes?"-Calls bezahlt.',
    },
    manualLabel: { en: "Manual reporting", de: "Manuelles Reporting" },
    webhealthLabel: { en: "With Webhealth", de: "Mit Webhealth" },
  },
  pricing: {
    eyebrow: { en: "Pricing", de: "Preise" },
    title: {
      en: "Start free. Scale per client.",
      de: "Kostenlos starten. Pro Kunde skalieren.",
    },
    lead: {
      en: "These homepage prices intentionally mirror the agency concept from the reference. Checkout and billing alignment still require follow-up work before every tier can be sold self-serve.",
      de: "Diese Homepage-Preise spiegeln bewusst das Agentur-Konzept aus der Referenz wider. Checkout und Billing müssen noch nachgezogen werden, bevor jeder Tarif im Self-Service verkauft werden kann.",
    },
    finePrint: {
      en: "All plans include the connected-data core today. White-label delivery, Looker export, and advanced agency controls remain staged rollout work until billing and product alignment ship.",
      de: "Alle Pläne enthalten heute den Kern der verbundenen Daten. White-Label-Deliverables, Looker-Export und erweiterte Agentur-Kontrollen bleiben gestufte Rollout-Arbeit, bis Billing und Produkt angleichen.",
    },
    agencySitesLabel: { en: "Client sites", de: "Kunden-Sites" },
    agencyPreviewLabel: {
      en: "Agency pricing preview",
      de: "Agentur-Preisvorschau",
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
      en: "Your clients' GSC + GA4 data is already sitting there.",
      de: "Die GSC- + GA4-Daten deiner Kunden liegen schon bereit.",
    },
    subtitle: {
      en: "Put it to work. One Google login for the connected-data core today, with the agency packaging on this page clearly labeled as preview until billing catches up.",
      de: "Setze sie in Arbeit. Ein Google-Login für den verbundenen Datenkern heute, mit dem Agentur-Paket auf dieser Seite klar als Preview markiert, bis Billing nachgezogen ist.",
    },
    primaryCta: {
      en: "Connect your Google Workspace",
      de: "Google Workspace verbinden",
    },
    secondaryCta: {
      en: "See pricing",
      de: "Preise ansehen",
    },
    notes: {
      en: ["No credit card", "Agency pricing preview", "EU-hosted core"],
      de: ["Keine Kreditkarte", "Agentur-Preisvorschau", "EU-gehosteter Kern"],
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

export const AGENCY_FEATURES: AgencyFeatureItem[] = [
  {
    icon: "users",
    color: "#6366f1",
    availability: "live",
    title: {
      en: "One login for every client.",
      de: "Ein Login für jeden Kunden.",
    },
    description: {
      en: "Connect your agency Google account once. Every GSC and GA4 property your team can already access appears immediately.",
      de: "Verbinde dein Agentur-Google-Konto einmal. Jede GSC- und GA4-Property, auf die dein Team bereits Zugriff hat, erscheint sofort.",
    },
  },
  {
    icon: "bar-chart-2",
    color: "#0ea5e9",
    availability: "live",
    title: {
      en: "Comparison reports on autopilot.",
      de: "Vergleichsreports auf Autopilot.",
    },
    description: {
      en: "Pick two date ranges per client. Clicks, impressions, CTR, position, sessions, and users stay side-by-side with signed deltas.",
      de: "Wähle pro Kunde zwei Zeiträume. Klicks, Impressionen, CTR, Position, Sessions und Nutzer bleiben nebeneinander mit vorzeichenbehafteten Deltas.",
    },
  },
  {
    icon: "zap",
    color: "#f59e0b",
    availability: "live",
    title: {
      en: "AI-ranked fixes with URLs and impact.",
      de: "KI-priorisierte Fixes mit URLs und Impact.",
    },
    description: {
      en: "The live reporting core already ranks opportunities per page using the connected inputs you saw above.",
      de: "Der Live-Reporting-Kern priorisiert Chancen bereits pro Seite anhand der verbundenen Eingaben von oben.",
    },
  },
  {
    icon: "palette",
    color: "#10b981",
    availability: "preview",
    title: {
      en: "White-label the client copy.",
      de: "Die Kunden-Version im White-Label.",
    },
    description: {
      en: "Branded client output is the intended agency layer. This page shows the target packaging, not a claim that every white-label surface ships today.",
      de: "Gebrandete Kunden-Ausgaben sind die beabsichtigte Agentur-Schicht. Diese Seite zeigt das Zielbild, nicht die Behauptung, dass heute schon jede White-Label-Oberfläche live ist.",
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
    availability: "planned",
    title: {
      en: "EU-hosted core. Agency controls staged.",
      de: "EU-gehosteter Kern. Agentur-Kontrollen gestuft.",
    },
    description: {
      en: "The connected-data core is EU-hosted today. Granular client permissions and SSO stay clearly labeled as follow-up product work.",
      de: "Der verbundene Datenkern ist heute EU-gehostet. Granulare Kundenrechte und SSO bleiben klar als nachgelagerte Produktarbeit markiert.",
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
    reportLabel: {
      en: "Last report · 2h ago",
      de: "Letzter Report · vor 2h",
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
    reportLabel: {
      en: "Last report · today",
      de: "Letzter Report · heute",
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
    reportLabel: {
      en: "Last report · yesterday",
      de: "Letzter Report · gestern",
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
    reportLabel: {
      en: "Last report · 3d ago",
      de: "Letzter Report · vor 3 T.",
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
      en: "Upload a logo, pick an accent, set a report subdomain (reports.youragency.com).",
      de: "Lade ein Logo hoch, wähle einen Akzent, setze eine Report-Subdomain (reports.deineagentur.de).",
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
      en: "Sessions and users layered onto the same report so traffic changes map back to commercial pages and supporting content.",
      de: "Sessions und Nutzer im selben Report, damit Traffic-Veränderungen auf kommerzielle Seiten und unterstützende Inhalte zurückgeführt werden können.",
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
      en: "Fresh crawl input on every report: broken H1s, 4xx links, missing meta, and other technical issues fed into the ranked list.",
      de: "Frische Crawl-Eingaben in jedem Report: kaputte H1s, 4xx-Links, fehlende Meta-Daten und andere technische Probleme fließen in die priorisierte Liste ein.",
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
      en: "AI-ranked P1/P2/P3 with URLs and impact",
      de: "KI-priorisiert P1/P2/P3 mit URLs und Impact",
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

export const AGENCY_PRICING_PLANS: PricingPlan[] = [
  {
    tier: "solo",
    highlight: false,
    name: { en: "Solo", de: "Solo" },
    description: {
      en: "For freelancers shipping their own site.",
      de: "Für Freelancer mit der eigenen Website.",
    },
    price: { en: "€0", de: "€0" },
    period: { en: "forever", de: "für immer" },
    cta: { en: "Start free", de: "Kostenlos starten" },
    features: [
      { en: "1 property (your own site)", de: "1 Property (deine Website)" },
      { en: "5 reports per month", de: "5 Reports pro Monat" },
      { en: "AI-ranked fix list", de: "KI-priorisierte Fix-Liste" },
      { en: "White-label off", de: "White-Label aus" },
      { en: "Community support", de: "Community-Support" },
    ],
  },
  {
    tier: "starter",
    highlight: false,
    name: { en: "Starter", de: "Starter" },
    description: {
      en: "For freelancers with a handful of clients.",
      de: "Für Freelancer mit einigen Kunden.",
    },
    price: { en: "€29", de: "€29" },
    period: { en: "/ mo", de: "/ Mon." },
    cta: { en: "Start Starter", de: "Starter starten" },
    features: [
      { en: "Up to 5 client sites", de: "Bis zu 5 Kunden-Sites" },
      { en: "Unlimited reports", de: "Unbegrenzte Reports" },
      { en: "White-label on (preview)", de: "White-Label an (Preview)" },
      { en: "2 team seats", de: "2 Team-Plätze" },
      { en: "Email support", de: "E-Mail-Support" },
    ],
  },
  {
    tier: "studio",
    highlight: true,
    badge: { en: "Most popular", de: "Am beliebtesten" },
    name: { en: "Studio", de: "Studio" },
    description: {
      en: "For small agencies running SEO monthly.",
      de: "Für kleine Agenturen mit monatlichem SEO.",
    },
    price: { en: "€79", de: "€79" },
    period: { en: "/ mo", de: "/ Mon." },
    cta: { en: "Start Studio", de: "Studio starten" },
    features: [
      { en: "Up to 20 client sites", de: "Bis zu 20 Kunden-Sites" },
      { en: "Unlimited reports", de: "Unbegrenzte Reports" },
      {
        en: "White-label + custom domain (preview)",
        de: "White-Label + Custom Domain (Preview)",
      },
      { en: "5 team seats", de: "5 Team-Plätze" },
      {
        en: "Looker Studio export (planned)",
        de: "Looker-Studio-Export (geplant)",
      },
      { en: "Priority support", de: "Priority-Support" },
    ],
  },
  {
    tier: "agency",
    highlight: false,
    name: { en: "Agency", de: "Agency" },
    description: {
      en: "For agencies at scale. Pay by client count.",
      de: "Für Agenturen in größerem Maßstab. Bezahle nach Kundenanzahl.",
    },
    price: { en: "€149", de: "€149" },
    period: { en: "base / mo", de: "Basis / Mon." },
    cta: { en: "Configure Agency", de: "Agency konfigurieren" },
    note: {
      en: "Up to 25 sites included, then +€6/site",
      de: "Bis zu 25 Sites inklusive, dann +6 €/Site",
    },
    features: [
      { en: "Unlimited team seats", de: "Unbegrenzte Team-Plätze" },
      {
        en: "Per-client access controls (planned)",
        de: "Kundenspezifische Rechte (geplant)",
      },
      { en: "SSO (SAML) planned", de: "SSO (SAML) geplant" },
      { en: "SLA & dedicated support", de: "SLA & dedizierter Support" },
      { en: "Custom onboarding", de: "Custom-Onboarding" },
    ],
  },
];

export const AGENCY_FAQ_ITEMS: FaqItem[] = [
  {
    question: {
      en: "Do my clients need their own Google login?",
      de: "Brauchen meine Kunden einen eigenen Google-Login?",
    },
    answer: {
      en: "No. The connected-data model starts from your agency Google account and the properties your team can already access.",
      de: "Nein. Das Modell für verbundene Daten startet bei deinem Agentur-Google-Konto und den Properties, auf die dein Team bereits Zugriff hat.",
    },
  },
  {
    question: {
      en: "What exactly is white-label here?",
      de: "Was bedeutet White-Label hier genau?",
    },
    answer: {
      en: "On this homepage it is a roadmap-preview promise: the intended branded client layer shown in the mockups, not a claim that every white-label delivery path is already shipped.",
      de: "Auf dieser Homepage ist es ein Roadmap-Preview-Versprechen: die beabsichtigte gebrandete Kunden-Schicht aus den Mockups, nicht die Behauptung, dass jeder White-Label-Delivery-Pfad bereits live ist.",
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
      en: "How does per-client pricing work on Agency?",
      de: 'Wie funktioniert das "pro Kunde"-Pricing bei Agency?',
    },
    answer: {
      en: "This homepage uses the reference pricing model exactly: Agency starts at €149 for up to 25 sites and adds €6 per site above that. Billing alignment still needs follow-up implementation.",
      de: "Diese Homepage verwendet das Referenz-Pricing exakt: Agency startet bei 149 € für bis zu 25 Sites und addiert 6 € pro weiterer Site. Die Billing-Angleichung braucht noch Folgearbeit.",
    },
  },
];
