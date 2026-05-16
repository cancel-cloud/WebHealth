import { getUserPreferredLanguage } from "@/lib/server/language";
import { requireAdminSession } from "@/lib/server/authz";

export const ADMIN_PAGE_COPY = {
  en: {
    aiPrompts: {
      title: "AI Prompt Templates",
      description: "Versioned system prompts for source summaries and the main SEO analyzer. Saving creates a new active version.",
    },
    aiDebug: {
      title: "Operations Debug Console",
      description: "Inspect source-data refreshes, property refreshes, AI run estimates, and OpenAI billed cost in one place.",
    },
    featureFlags: {
      title: "Feature Flags",
      description: "Toggle features globally or override per user. Click a row to manage per-user overrides.",
    },
    feedback: {
      title: "Feedback Inbox",
      description: "Review user-submitted feature requests and bug reports.",
    },
    globalSettings: {
      title: "Global Settings",
      description: "Configure plan tier limits. Leave blank for unlimited.",
    },
    logs: {
      title: "System Logs",
      description: "Admin syncs, background refreshes, AI insight runs, action changes, and snapshot activity.",
    },
    productAnalytics: {
      title: "Product Analytics",
      description: "Internal product usage, AI cost estimates, OpenAI billed cost, and operational throughput.",
    },
    syncing: {
      title: "Syncing",
      description: "Manually trigger Google property sync for any user.",
    },
    users: {
      title: "User Management",
      description: "All registered users with their team and property usage.",
    },
    glitchtip: {
      title: "GlitchTip Test",
      description: "Verify that browser-side error tracking is configured, then trigger a test error and confirm it appears in GlitchTip Issues.",
      readiness: "Tracking Readiness",
      configured: "Configured",
      missingDsn: "Missing DSN",
      readinessDescription: "This checks whether client-side Sentry or GlitchTip delivery is configured in this app. It does not perform a live upstream health check.",
      publicDsn: "Public DSN",
      environment: "Environment",
      release: "Release",
      notConfigured: "Not configured",
      notSet: "Not set",
      verificationSteps: "Verification steps",
      steps: [
        "Open GlitchTip Issues in a separate tab.",
        "Click the test button below.",
        "Expect the page interaction to interrupt with Generic Error Message.",
        "Confirm the same error appears as a new issue in GlitchTip.",
      ],
      readyHint: "Use this only when you want to verify end-to-end client delivery.",
      missingHint: "Set NEXT_PUBLIC_SENTRY_DSN before using this test page so the browser can send the error event.",
    },
  },
  de: {
    aiPrompts: {
      title: "AI-Prompt-Vorlagen",
      description: "Versionierte System-Prompts für Source Summaries und den main SEO analyzer. Speichern erstellt eine neue aktive Version.",
    },
    aiDebug: {
      title: "Operations-Debug-Konsole",
      description: "Prüfe Source-Data-Refreshes, Property-Refreshes, AI run estimates und OpenAI billed cost an einem Ort.",
    },
    featureFlags: {
      title: "Feature Flags",
      description: "Schalte Features global oder je User frei. Klicke eine Zeile, um User-Overrides zu verwalten.",
    },
    feedback: {
      title: "Feedback-Posteingang",
      description: "Prüfe eingereichte Feature-Wünsche und Bug-Reports.",
    },
    globalSettings: {
      title: "Globale Einstellungen",
      description: "Konfiguriere Limits der Plan-Stufen. Leer lassen bedeutet unbegrenzt.",
    },
    logs: {
      title: "System-Logs",
      description: "Admin-Syncs, Hintergrund-Refreshes, AI-Insight-Läufe, Maßnahmenänderungen und Snapshot-Aktivität.",
    },
    productAnalytics: {
      title: "Produktanalyse",
      description: "Interne Produktnutzung, AI-Kostenschätzungen, OpenAI billed cost und operativer Durchsatz.",
    },
    syncing: {
      title: "Synchronisierung",
      description: "Google-Property-Sync für einzelne User manuell starten.",
    },
    users: {
      title: "User-Verwaltung",
      description: "Alle registrierten User mit Team- und Property-Nutzung.",
    },
    glitchtip: {
      title: "GlitchTip-Test",
      description: "Prüfe die browserseitige Fehlererfassung, löse einen Testfehler aus und bestätige ihn in GlitchTip Issues.",
      readiness: "Tracking-Bereitschaft",
      configured: "Konfiguriert",
      missingDsn: "DSN fehlt",
      readinessDescription: "Dies prüft, ob clientseitige Sentry- oder GlitchTip-Auslieferung in dieser App konfiguriert ist. Es ist kein Live-Upstream-Healthcheck.",
      publicDsn: "Public DSN",
      environment: "Environment",
      release: "Release",
      notConfigured: "Nicht konfiguriert",
      notSet: "Nicht gesetzt",
      verificationSteps: "Prüfschritte",
      steps: [
        "Öffne GlitchTip Issues in einem separaten Tab.",
        "Klicke unten auf den Testbutton.",
        "Erwarte, dass die Seiteninteraktion mit Generic Error Message unterbrochen wird.",
        "Bestätige, dass derselbe Fehler als neues Issue in GlitchTip erscheint.",
      ],
      readyHint: "Nur nutzen, wenn du die Ende-zu-Ende-Auslieferung im Client prüfen willst.",
      missingHint: "Setze NEXT_PUBLIC_SENTRY_DSN, bevor du diese Testseite nutzt, damit der Browser das Fehler-Event senden kann.",
    },
  },
} as const;

export async function getAdminLanguage() {
  const session = await requireAdminSession();
  return getUserPreferredLanguage(session.user.id);
}
