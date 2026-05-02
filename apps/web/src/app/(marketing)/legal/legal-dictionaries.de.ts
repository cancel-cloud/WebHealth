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

export const legalDictionaryDe = {
  locale: "de",
  ui: {
    languageToggleLabel: "Dokumentsprache",
    languageLabels: {
      en: "English",
      de: "Deutsch",
    },
    documentLabels: {
      privacy: "Datenschutzhinweise",
      terms: "Nutzungsbedingungen",
      impressum: "Impressum",
    },
    relatedDocumentsLabel: "Weitere rechtliche Dokumente",
  },
  documents: {
    privacy: {
      title: "Datenschutzhinweise",
      description: "Wie Webhealth personenbezogene Daten erhebt, nutzt und schützt — Verschlüsselung, Speicherdauer und Ihre Betroffenenrechte nach DSGVO.",
      lastUpdatedLabel: "Stand: März 2026",
      intro: [
        `${legalProfile.productName} wird von ${getOperatorDisplayName("de")} betrieben. Diese Hinweise erklären, wie wir personenbezogene Daten verarbeiten, wenn Sie die Website besuchen, sich mit Google anmelden, Datenquellen verbinden, Snapshots erstellen, den Support kontaktieren oder kostenpflichtige Funktionen nutzen.`,
        "Dieses Dokument ist so formuliert, dass es sowohl für Geschäftskunden als auch für Verbraucher nutzbar ist. Zwingende gesetzliche Rechte bleiben unberührt.",
      ],
      sections: [
        {
          title: "Verantwortlicher und Kontakt",
          paragraphs: [
            `Verantwortlicher: ${getOperatorDisplayName("de")}, ${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, Deutschland.`,
            `Allgemeiner Kontakt: ${legalProfile.email}. ${getPrivacyContactSentence("de")}`,
          ],
        },
        {
          title: "Welche Daten wir verarbeiten",
          bullets: [
            "Konto- und Identitätsdaten wie Name, E-Mail-Adresse, Profilbild, Google-Kennungen und Sitzungsdaten.",
            "Verschlüsselte Google-Provider-Tokens, Ablaufdaten der Tokens und Google-Lokalisierungsdaten, die für den Zugriff auf Search Console und Analytics erforderlich sind.",
            "Google Search Console Kennzahlen wie Klicks, Impressionen, CTR, Position, Queries und seitenbezogene Performancewerte.",
            "Google Analytics 4 Kennzahlen wie Sitzungen, Nutzer, neue Nutzer, Traffic-Quellen, Landingpages und weitere Snapshot-Eingaben zur gewählten Property.",
            "Crawl- und Auditdaten öffentlich erreichbarer Seiten, einschließlich defekter Links, fehlender Metadaten und sonstiger technischer Auffälligkeiten.",
            "Workspace-Einstellungen, Snapshot-Verlauf, Abrechnungsstatus, Feature-Flags und Nutzungsdaten zum gebuchten Plan.",
            "Support- und Feedbackdaten, einschließlich Nachrichteninhalt und den an die Anfrage angehängten Kontodaten.",
            "Sicherheits- und Auditdaten wie IP-Adresse, User-Agent, Admin-/Systemlog-Einträge und operative Fehlermeldungen.",
            "Browser- und Gerätespeicher, einschließlich Authentifizierungs-Cookies, UI-State-Cookies und Local-Storage-Einträgen für Onboarding oder ausstehende Aktionen.",
          ],
        },
        {
          title: "Zwecke und Rechtsgrundlagen",
          bullets: [
            "Bereitstellung des Dienstes, Authentifizierung und Erstellung angeforderter Snapshots: Vertragserfüllung oder Durchführung vorvertraglicher Maßnahmen.",
            "Automatische Synchronisierung verfügbarer Google-Properties nach der Anmeldung: Vertragserfüllung und unser berechtigtes Interesse an einer einfachen Einrichtung.",
            "Verarbeitung von Abonnements, Belegen, Kündigungen und Planlimits: Vertragserfüllung sowie gesetzliche Aufbewahrungspflichten.",
            "Betrieb von Snapshot-Exporten, Live-Dashboards, Datenaktualisierungen und Property-Refreshes: Vertragserfüllung.",
            "Bearbeitung von Supportanfragen, Feedback und accountbezogener Kommunikation: Vertragserfüllung und berechtigtes Interesse an Support.",
            "Missbrauchsverhinderung, Sicherheit, Incident-Untersuchungen und Audit-Trails: berechtigte Interessen an Sicherheit, Betrugsprävention und zuverlässigem Betrieb.",
            "Messung der Websitenutzung mit Google Analytics 4 nach Ihrer Einwilligung in Analytics-Cookies: Einwilligung.",
          ],
        },
        {
          title: "Google-API-Zugriff und Funktionsweise",
          paragraphs: [
            "Bei der Anmeldung mit Google fordern wir nur lesenden Zugriff auf Google Search Console und Google Analytics 4 sowie grundlegende Identitätsscopes an. Schreibzugriff auf Ihr Google-Konto wird nicht angefordert.",
            "Nach der ersten Google-Anmeldung kann die App automatisch erreichbare Search-Console- und GA4-Properties in Ihren Workspace synchronisieren. Für die Snapshot-Erstellung wird anschließend die ausgewählte verbundene Property samt erforderlicher Kontextdaten verwendet.",
            "Wir verwenden aus Google stammende Daten ausschließlich zur Bereitstellung, Absicherung und Verbesserung der angeforderten Snapshot- und Dashboard-Funktionen. Wir verkaufen keine Google-Nutzerdaten und verwenden sie nicht zu fremden Werbezwecken.",
          ],
        },
        {
          title: "Google Analytics 4 für Website-Tracking",
          paragraphs: [
            "Wir verwenden Google Analytics 4, um die Nutzung der Website zu messen. Dabei können insbesondere Seitenaufrufe, Navigations- und Interaktionsereignisse, ungefähre Geräte- und Browserinformationen sowie Referrer-Daten verarbeitet werden.",
            "Google Analytics 4 wird erst aktiviert, nachdem Sie im Consent-Banner Analytics-Cookies akzeptiert haben. Wenn Sie ablehnen, wird das Google-Tag nicht geladen. Ihre Auswahl können Sie später jederzeit über die Cookie-Einstellungen im Footer ändern.",
          ],
        },
        {
          title: "Vercel Analytics",
          paragraphs: [
            "Wir verwenden Vercel Analytics zur Messung der Websitenutzung. Dabei können Seitenaufrufe, Referrer, Gerätetyp, Browsertyp sowie das Herkunftsland (abgeleitet aus der IP-Adresse) verarbeitet werden. Vercel Analytics setzt keine Cookies und verwendet keine persistenten Identifier.",
            "Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der Messung der Websitenutzung (Art. 6 Abs. 1 lit. f DSGVO). Da keine Cookies oder clientseitiger Speicher eingesetzt werden, findet § 25 TDDDG keine Anwendung. Sie können der Verarbeitung widersprechen.",
          ],
        },
        {
          title: "Empfänger und Auftragsverarbeiter",
          bullets: [
            "Google für OAuth-Anmeldung, als verbundene Datenquelle für Search Console und GA4 sowie als Anbieter von Google Analytics 4 für Website-Analysen nach Einwilligung.",
            "OpenAI zur Verarbeitung importierter Abrechnungsdaten, sofern konfiguriert.",
            "Stripe zur Anlage von Kundenprofilen, Abwicklung von Abonnements und Bereitstellung des Billing-Portals.",
            "Vercel zum Hosting und Ausliefern der Webanwendung.",
            "Hetzner/PostgreSQL zum Hosting der Anwendungsdatenbank und Worker-Infrastruktur in der EU.",
            "GlitchTip zur Erfassung operativer Fehler und sicherheitsrelevanter Ausnahmen.",
            "Vercel Analytics zur cookielosen Messung von Seitenaufrufen, Referrern, Gerätetyp und Herkunftsland. Vercel verarbeitet diese Daten auf eigener Infrastruktur; IP-Adressen werden nicht dauerhaft gespeichert.",
          ],
        },
        {
          title: "Datensicherheit",
          bullets: [
            "Der gesamte Netzwerkverkehr zwischen Ihrem Browser, unseren Servern und Auftragsverarbeitern wird per TLS (HTTPS) transportverschlüsselt.",
            "Google-OAuth-Tokens — einschließlich Access-Tokens, Refresh-Tokens und ID-Tokens — werden vor der Speicherung in der Datenbank mit AES-256-GCM und individuellen Initialisierungsvektoren verschlüsselt.",
            "Über die Search-Console- und Analytics-APIs bezogene Google-Nutzerdaten werden in einer verschlüsselten Datenbank gespeichert und unterliegen denselben Zugangskontrollen wie alle übrigen Anwendungsdaten.",
            "Die Anwendungsdatenbank wird auf vom Betreiber verwalteter PostgreSQL-Infrastruktur in der EU mit eingeschränkter Netzfreigabe und authentifiziertem Administrationszugang betrieben.",
            "Der Zugang zur Produktionsinfrastruktur, zur Datenbank und zu Verschlüsselungsschlüsseln ist auf den Betreiber beschränkt und durch starke Authentifizierung geschützt.",
            "Wir unterhalten Verfahren zur Erkennung, Untersuchung und Reaktion auf Sicherheitsvorfälle, einschließlich der Benachrichtigung betroffener Personen und Aufsichtsbehörden, soweit gesetzlich vorgeschrieben.",
            "Auftragsverarbeiter werden unter Berücksichtigung ihrer technischen und organisatorischen Sicherheitsmaßnahmen ausgewählt und durch Auftragsverarbeitungsverträge gebunden.",
          ],
        },
        {
          title: "Internationale Datenübermittlungen",
          paragraphs: [
            "Einige Auftragsverarbeiter können Daten außerhalb der EU/des EWR verarbeiten oder zugänglich machen, insbesondere in den Vereinigten Staaten. Dies kann je nach Servicefluss und eingesetzten Unterauftragsverarbeitern vor allem Google, OpenAI, Stripe, Vercel und GlitchTip betreffen.",
            "Soweit erforderlich, stützen wir solche Übermittlungen auf Angemessenheitsbeschlüsse, das EU-U.S. Data Privacy Framework, Standardvertragsklauseln oder vergleichbare Schutzmechanismen.",
          ],
        },
        {
          title: "Speicherdauer",
          bullets: [
            "Konto- und Workspace-Daten werden grundsätzlich solange gespeichert, wie das Konto aktiv ist, sofern keine längere gesetzliche Aufbewahrungspflicht besteht.",
            "Snapshots, generierte Erkenntnisse und zugehörige Kennzahlen bleiben grundsätzlich verfügbar, solange das Konto aktiv ist, vorbehaltlich Löschanfragen und operativer Aufbewahrungsfristen.",
            "Wenn Sie eine Google-Datenquelle trennen oder den Zugriff widerrufen, werden die zugehörigen Tokens umgehend gelöscht. Bei Löschung Ihres Kontos werden sämtliche gespeicherten Google-Nutzerdaten — einschließlich Tokens, synchronisierter Properties und Snapshot-Daten — gelöscht.",
            "Feedback, Audit-Logs und Sicherheitsevents werden solange gespeichert, wie dies für Support, Missbrauchsverhinderung und Nachvollziehbarkeit erforderlich ist; anschließend werden sie gelöscht oder anonymisiert.",
            "Abrechnungs- und Buchhaltungsunterlagen können aufgrund steuer- oder handelsrechtlicher Vorgaben länger aufbewahrt werden.",
          ],
        },
        {
          title: "Erforderliche Daten und automatisierte Entscheidungen",
          paragraphs: [
            "Bestimmte Daten sind erforderlich, um ein Konto anzulegen, Google-Datenquellen zu verbinden, einen kostenpflichtigen Plan zu kaufen oder Snapshots zu erzeugen. Wenn Sie die dafür erforderlichen Daten nicht bereitstellen, können wir den jeweiligen Teil des Dienstes möglicherweise nicht anbieten.",
            "Wir verwenden keine ausschließlich automatisierte Entscheidungsfindung einschließlich Profiling, die im Sinne von Artikel 22 DSGVO rechtliche Wirkungen oder vergleichbar erhebliche Beeinträchtigungen entfaltet.",
          ],
        },
        {
          title: "Cookies und sonstiger Gerätespeicher",
          paragraphs: [
            "Wir verwenden Cookies und sonstigen Gerätespeicher, die für den Betrieb des Dienstes und die Speicherung einfacher UI-Zustände erforderlich sind. Dazu zählen Authentifizierungs-/Sitzungs-Cookies, ein Sidebar-State-Cookie sowie Local-Storage-Einträge für Onboarding, ausstehende UI-Aktionen und Ihre gespeicherte Analytics-Einwilligung.",
            "Wenn Sie Analytics-Cookies akzeptieren, laden wir zusätzlich das Google-Tag für Google Analytics 4 zur Reichweitenmessung der Website. Wenn Sie ablehnen, bleibt das Google-Tag deaktiviert.",
          ],
        },
        {
          title: "Ihre Rechte",
          bullets: [
            "Sie können nach Maßgabe der gesetzlichen Voraussetzungen Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit oder Widerspruch verlangen.",
            "Soweit eine Verarbeitung auf Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen oder ändern, insbesondere über die Cookie-Einstellungen im Footer.",
            `Sie können sich bei einer zuständigen Aufsichtsbehörde beschweren. Für Hessen ist dies derzeit ${legalProfile.supervisoryAuthority}.`,
          ],
        },
        {
          title: "Änderungen dieser Hinweise",
          paragraphs: [
            "Wir können diese Hinweise anpassen, wenn sich Produkt, Auftragsverarbeiter oder rechtliche Anforderungen ändern. Wesentliche Änderungen kommunizieren wir, soweit erforderlich, im Dienst oder per E-Mail.",
          ],
        },
      ],
    },
    terms: {
      title: "Nutzungsbedingungen",
      description: "Bedingungen für die Nutzung von Webhealth — Pläne, Abrechnung, Kündigung, Verbraucherrechte und Haftung für SEO- und Analyse-Funktionen.",
      lastUpdatedLabel: "Stand: März 2026",
      intro: [
        `${legalProfile.productName} wird von ${getOperatorDisplayName("de")} bereitgestellt. Diese Bedingungen sind so formuliert, dass sie sowohl für Geschäftskunden als auch für Verbraucher gelten, sofern einzelne Klauseln nichts anderes bestimmen.`,
      ],
      sections: [
        {
          title: "Vertragsschluss und Nutzungsberechtigung",
          paragraphs: [
            "Mit der Kontoerstellung, dem Verbinden einer Datenquelle oder der Nutzung des Dienstes akzeptieren Sie diese Nutzungsbedingungen. Wenn Sie nicht zustimmen, dürfen Sie den Dienst nicht nutzen.",
            "Sie müssen rechtlich in der Lage sein, einen Vertrag abzuschließen, und dürfen nur Konten verwenden, über die Sie verfügungsberechtigt sind.",
          ],
        },
        {
          title: "Leistungsbeschreibung",
          paragraphs: [
            "Webhealth verbindet Google Search Console und Google Analytics 4, führt Website-Crawls durch und stellt SEO- und Analytics-Live-Dashboards, Snapshot-Exporte und deterministische Handlungsempfehlungen bereit.",
            "Der Dienst dient der Unterstützung bei der Analyse von Website-Performance. Er ersetzt keine rechtliche, steuerliche, finanzielle oder sonstige professionelle Beratung.",
          ],
        },
        {
          title: "Accounts und zulässige Nutzung",
          bullets: [
            "Nutzen Sie den Dienst nur für Websites und Datenquellen, die Ihnen gehören oder für die Sie autorisiert sind.",
            "Unterlassen Sie Störungen, Reverse Engineering, Weiterverkauf oder sonstige missbräuchliche Nutzung des Dienstes oder seiner Limits.",
            "Halten Sie Ihren Zugang und das verbundene Google-Konto sicher.",
            "Sie bleiben verantwortlich für die Rechtmäßigkeit Ihrer Inhalte, Eingaben und der Umsetzung generierter Empfehlungen.",
          ],
        },
        {
          title: "Pläne, Abrechnung und Kündigung",
          paragraphs: [
            `Der Dienst bietet derzeit einen Solo-Plan sowie kostenpflichtige Pläne einschließlich Pro an (${legalProfile.productName} nutzt Stripe für die Abrechnung). Preise und Nutzungsgrenzen werden im Produkt und beim Checkout angezeigt.`,
            "Kostenpflichtige Abonnements verlängern sich gemäß dem beim Checkout dargestellten Modell, sofern sie nicht gekündigt werden. Die Verwaltung der Kündigung erfolgt über das Billing-Portal. Gesetzliche Verbraucherrechte, einschließlich zwingender Widerrufs- oder Kündigungsrechte, bleiben unberührt.",
            "Erstattungen richten sich nach den Checkout-Bedingungen, dem anwendbaren Recht und etwaigen zwingenden Verbraucherschutzvorschriften.",
          ],
        },
        {
          title: "Snapshot-Ausgaben",
          paragraphs: [
            "Snapshots und Dashboards werden aus verbundenen Kennzahlen, Crawling-Ergebnissen und deterministischer Priorisierungslogik erzeugt. Prüfen Sie die zugrunde liegenden Daten, bevor Sie Maßnahmen ergreifen.",
            "Für Entscheidungen auf Grundlage der Snapshot-Ausgaben bleiben Sie verantwortlich.",
          ],
        },
        {
          title: "Verfügbarkeit und Änderungen",
          paragraphs: [
            "Wir dürfen den Dienst ändern, verbessern oder anpassen, soweit dies zur Sicherheit, zur Einhaltung des Rechts, zur Weiterentwicklung des Produkts oder aus vergleichbaren sachlichen Gründen erforderlich ist.",
            "Soweit gesetzlich erforderlich, informieren wir über wesentliche Änderungen, die bezahlte Funktionen erheblich betreffen.",
          ],
        },
        {
          title: "Geistiges Eigentum",
          paragraphs: [
            "Alle Rechte am Dienst, an der Software, am Branding und an von uns erstellten Materialien verbleiben bei uns. Rechte an Ihren Daten und Snapshot-Eingaben verbleiben bei Ihnen.",
            "Sie erhalten ein beschränktes, nicht ausschließliches und nicht übertragbares Recht zur Nutzung des Dienstes nach Maßgabe dieser Bedingungen.",
          ],
        },
        {
          title: "Haftung und zwingende Rechte",
          paragraphs: [
            "Nichts in diesen Bedingungen schließt die Haftung für Vorsatz, grobe Fahrlässigkeit, Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit oder sonstige gesetzlich nicht abdingbare Haftung aus bzw. beschränkt diese.",
            "Bei leichter Fahrlässigkeit ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt, soweit nicht zwingendes Recht etwas anderes vorsieht.",
            "Zwingende gesetzliche Rechte, insbesondere Verbraucherrechte, bleiben unberührt.",
          ],
        },
        {
          title: "Anwendbares Recht, Gerichtsstand und Streitbeilegung",
          paragraphs: [
            "Es gilt deutsches Recht. Wenn Sie Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat sind, bleiben Ihnen die zwingenden Schutzvorschriften dieses Staates erhalten.",
            `Für Unternehmer ist, soweit gesetzlich zulässig, ${legalProfile.city}, Deutschland, ausschließlicher Gerichtsstand. Verbraucher können Klagen vor den ihnen gesetzlich eröffneten Gerichten erheben.`,
            getDisputeResolutionStatement("de"),
          ],
        },
        {
          title: "Kontakt",
          paragraphs: [`Fragen zu diesen Nutzungsbedingungen senden Sie bitte an ${legalProfile.email}.`],
        },
      ],
    },
    impressum: {
      title: "Impressum",
      description: "Anbieterkennzeichnung, Kontaktdaten und gesetzliche Pflichtangaben nach § 5 TMG für den Webhealth-SEO- und Analyse-Dienst von DevBrew.",
      lastUpdatedLabel: "Stand: März 2026",
      intro: [
        "Dieses Impressum enthält die Anbieterkennzeichnung und die Angaben zur Verbraucherstreitbeilegung für Webhealth.",
      ],
      sections: [
        {
          title: "Anbieter",
          paragraphs: getImpressumProviderParagraphs("de"),
        },
        {
          title: "Kontakt",
          paragraphs: getImpressumContactParagraphs("de"),
        },
        ...(getRegisterEntryParagraphs("de").length
          ? [
              {
                title: "Registereintrag",
                paragraphs: getRegisterEntryParagraphs("de"),
              },
            ]
          : []),
        ...(getTaxIdentifierParagraphs("de").length
          ? [
              {
                title: "Steuerliche Kennnummern",
                paragraphs: getTaxIdentifierParagraphs("de"),
              },
            ]
          : []),
        ...(getDataProtectionOfficerParagraphs("de").length
          ? [
              {
                title: "Datenschutzbeauftragte/r",
                paragraphs: getDataProtectionOfficerParagraphs("de"),
              },
            ]
          : []),
        {
          title: "Verbraucherstreitbeilegung",
          paragraphs: [getDisputeResolutionStatement("de")],
        },
      ],
    },
  },
} satisfies LegalDictionary;
