"use client";

import { createContext, useContext } from "react";
import type { SupportedLanguage } from "@webhealth/shared/lib/language";

export const APP_LANGUAGE_COPY = {
  en: {
    shell: {
      navigation: "Navigation",
      navigationDescription: "Navigate the authenticated WebHealth application.",
      openNavigation: "Open navigation",
      productSubtitle: "SEO operations cockpit",
    },
    sidebar: {
      overview: "Overview",
      properties: "Properties",
      aiInsights: "AI Insights",
      settings: "Settings",
      syncing: "Syncing",
      userManagement: "User Management",
      feedbackInbox: "Feedback Inbox",
      productAnalytics: "Product Analytics",
      systemLogs: "System Logs",
      featureFlags: "Feature Flags",
      globalSettings: "Global Settings",
      aiPrompts: "AI Prompts",
      opsDebugConsole: "Ops Debug Console",
      glitchtipTest: "GlitchTip Test",
      contactSupport: "Contact Support",
      featureRequests: "Feature Requests",
      yourProperties: "Your Properties",
      admin: "Admin",
      adminTools: "Admin tools",
      help: "Help",
      account: "Account",
      contactAndSupport: "Contact & Support",
      theme: "Theme",
      signOut: "Sign out",
      linked: "Linked",
      gscOnly: "Search Console only",
      analyticsOnly: "Analytics only",
      websiteFallback: "Website",
      userFallback: "User",
    },
    theme: {
      system: "System",
      light: "Lightmode",
      dark: "Darkmode",
    },
    command: {
      title: "Command palette",
      placeholder: "Type a command or search...",
      empty: "No results found.",
      navigation: "Navigation",
      actions: "Actions",
      appearance: "Appearance",
      admin: "Admin",
      account: "Account",
      goToDashboard: "Go to Dashboard",
      goToProperties: "Go to Properties",
      goToSettings: "Go to Settings",
      goToBranding: "Go to Branding",
      openProperties: "Open Properties",
      syncProperties: "Sync Properties",
      contactSupport: "Contact Support",
      featureRequests: "Feature Requests",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      systemMode: "System Mode",
      userManagement: "User Management",
      systemLogs: "System Logs",
      featureFlags: "Feature Flags",
      globalSettings: "Global Settings",
      opsDebugConsole: "Ops Debug Console",
      signOut: "Sign Out",
    },
    googleAccess: {
      restored: "Google access restored. Properties synced.",
      reconnectFailed: "Google reconnected, but property sync failed.",
      reviewTitle: "Review Google access",
      reviewDescription: "Reconnect Google to restore property sync and refresh actions.",
      needsToHappen: "What needs to happen",
      reconnectAccount: "Reconnect your Google account.",
      approveAccess: "Approve the required Search Console and Analytics access on the consent screen.",
      returnToWebHealth: "Return to WebHealth so we can refresh your properties automatically.",
      reconnectGoogle: "Reconnect Google",
      reconnecting: "Reconnecting...",
      close: "Close",
    },
  },
  de: {
    shell: {
      navigation: "Navigation",
      navigationDescription: "Navigiere durch die angemeldete WebHealth-App.",
      openNavigation: "Navigation öffnen",
      productSubtitle: "SEO-Operations-Cockpit",
    },
    sidebar: {
      overview: "Übersicht",
      properties: "Properties",
      aiInsights: "KI-Insights",
      settings: "Einstellungen",
      syncing: "Synchronisierung",
      userManagement: "Nutzerverwaltung",
      feedbackInbox: "Feedback-Postfach",
      productAnalytics: "Produktanalyse",
      systemLogs: "Systemprotokolle",
      featureFlags: "Feature Flags",
      globalSettings: "Globale Einstellungen",
      aiPrompts: "KI-Prompts",
      opsDebugConsole: "Ops-Debug-Konsole",
      glitchtipTest: "GlitchTip-Test",
      contactSupport: "Support kontaktieren",
      featureRequests: "Feature-Wünsche",
      yourProperties: "Deine Properties",
      admin: "Admin",
      adminTools: "Admin-Tools",
      help: "Hilfe",
      account: "Konto",
      contactAndSupport: "Kontakt & Support",
      theme: "Darstellung",
      signOut: "Abmelden",
      linked: "Verknüpft",
      gscOnly: "Nur Search Console",
      analyticsOnly: "Nur Analytics",
      websiteFallback: "Website",
      userFallback: "Nutzer",
    },
    theme: {
      system: "System",
      light: "Hell",
      dark: "Dunkel",
    },
    command: {
      title: "Befehlspalette",
      placeholder: "Befehl eingeben oder suchen...",
      empty: "Keine Ergebnisse gefunden.",
      navigation: "Navigation",
      actions: "Aktionen",
      appearance: "Darstellung",
      admin: "Admin",
      account: "Konto",
      goToDashboard: "Zur Übersicht",
      goToProperties: "Zu Properties",
      goToSettings: "Zu Einstellungen",
      goToBranding: "Zu Branding",
      openProperties: "Properties öffnen",
      syncProperties: "Properties synchronisieren",
      contactSupport: "Support kontaktieren",
      featureRequests: "Feature-Wünsche",
      lightMode: "Hellmodus",
      darkMode: "Dunkelmodus",
      systemMode: "Systemmodus",
      userManagement: "Nutzerverwaltung",
      systemLogs: "Systemprotokolle",
      featureFlags: "Feature Flags",
      globalSettings: "Globale Einstellungen",
      opsDebugConsole: "Ops-Debug-Konsole",
      signOut: "Abmelden",
    },
    googleAccess: {
      restored: "Google-Zugriff wiederhergestellt. Properties synchronisiert.",
      reconnectFailed: "Google ist wieder verbunden, aber die Property-Synchronisierung ist fehlgeschlagen.",
      reviewTitle: "Google-Zugriff prüfen",
      reviewDescription: "Verbinde Google erneut, um Property-Synchronisierung und Aktualisierungen wiederherzustellen.",
      needsToHappen: "Was passieren muss",
      reconnectAccount: "Verbinde dein Google-Konto erneut.",
      approveAccess: "Bestätige im Consent Screen den nötigen Zugriff auf Search Console und Analytics.",
      returnToWebHealth: "Kehre zu WebHealth zurück, damit wir deine Properties automatisch aktualisieren können.",
      reconnectGoogle: "Google erneut verbinden",
      reconnecting: "Verbindet...",
      close: "Schließen",
    },
  },
} as const;

type WidenCopy<T> = {
  [Key in keyof T]: T[Key] extends string ? string : WidenCopy<T[Key]>;
};

export type AppLanguageCopy = WidenCopy<typeof APP_LANGUAGE_COPY.en>;

const AppLanguageContext = createContext<SupportedLanguage>("de");

export function AppLanguageProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: SupportedLanguage;
}) {
  return <AppLanguageContext.Provider value={language}>{children}</AppLanguageContext.Provider>;
}

export function useAppLanguage() {
  return useContext(AppLanguageContext);
}

export function useAppCopy() {
  return APP_LANGUAGE_COPY[useAppLanguage()] as AppLanguageCopy;
}
