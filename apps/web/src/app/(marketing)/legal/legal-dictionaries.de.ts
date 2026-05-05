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
      dpa: "Auftragsverarbeitungsvertrag",
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
            "Messung der Websitenutzung mit Google Analytics 4 und PostHog-Browser-Analytics nach Ihrer Einwilligung in Analytics-Cookies: Einwilligung.",
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
          title: "Google Analytics 4 und PostHog für Website-Tracking",
          paragraphs: [
            "Wir verwenden Google Analytics 4 und PostHog-Browser-Analytics, um die Nutzung der Website zu messen. Dabei können insbesondere Seitenaufrufe, Navigations- und Interaktionsereignisse, ungefähre Geräte- und Browserinformationen sowie Referrer-Daten verarbeitet werden.",
            "Google Analytics 4 und PostHog-Browser-Analytics werden erst aktiviert, nachdem Sie im Consent-Banner Analytics-Cookies akzeptiert haben. Wenn Sie ablehnen, werden diese Browser-Analytics-Tags nicht geladen. Ihre Auswahl können Sie später jederzeit über die Cookie-Einstellungen im Footer ändern.",
            "PostHog-Browser-Traffic wird über unseren verwalteten Reverse Proxy an die PostHog-EU-Instanz weitergeleitet.",
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
            "Google Ireland Ltd. (Gordon House, Barrow Street, Dublin 4, Irland) bzw. Google LLC für OAuth-Anmeldung, als verbundene Datenquelle für Search Console und GA4 sowie als Anbieter von Google Analytics 4 für Website-Analysen nach Einwilligung.",
            "OpenAI, L.L.C. (San Francisco, USA) zur Erzeugung der KI-gestützten Snapshot-Empfehlungen sowie zur Verarbeitung importierter Abrechnungsdaten, sofern konfiguriert. Es ist ein Auftragsverarbeitungsvertrag (Data Processing Addendum) abgeschlossen.",
            "Stripe Payments Europe Ltd. (Dublin, Irland) bzw. Stripe Inc. (USA) zur Anlage von Kundenprofilen, Abwicklung von Abonnements, Bereitstellung des Billing-Portals und Versand der transaktionalen Zahlungs- und Beleg-E-Mails.",
            "Vercel Inc. (San Francisco, USA) zum Hosting und Ausliefern der Webanwendung; das Frontend wird in der Vercel-Region Frankfurt (EU) betrieben.",
            "Hetzner Online GmbH (Industriestraße 25, 91710 Gunzenhausen, Deutschland) für den Betrieb der selbst verwalteten PostgreSQL-Datenbank und der Worker-Infrastruktur im Rechenzentrum Nürnberg (EU). Es besteht ein Auftragsverarbeitungsvertrag mit Hetzner.",
            "GlitchTip zur Erfassung operativer Fehler und sicherheitsrelevanter Ausnahmen — selbst gehostet auf Hetzner-Infrastruktur in Nürnberg, ohne Übermittlung an Dritte.",
            "PostHog Inc. (San Francisco, USA), betrieben über die EU-Instanz in Frankfurt, für serverseitige Produktanalyse und einwilligungsbasierte Browser-Analytics über unseren verwalteten Reverse Proxy. Es ist ein Auftragsverarbeitungsvertrag abgeschlossen.",
            "Vercel Analytics zur cookielosen Messung von Seitenaufrufen, Referrern, Gerätetyp und Herkunftsland. Vercel verarbeitet diese Daten auf eigener Infrastruktur; IP-Adressen werden nicht dauerhaft gespeichert.",
          ],
        },
        {
          title: "Auftragsverarbeitung für Kunden-Datenquellen (GSC & GA4)",
          paragraphs: [
            "Wenn Sie als Geschäftskunde Ihre Google-Search-Console- oder Google-Analytics-4-Property mit Webhealth verbinden, werden die zu Ihrer Property gehörenden Such-, Klick-, Impressions- und Nutzungsdaten in Ihrem Auftrag verarbeitet. Soweit diese Daten personenbezogene Daten Ihrer Endnutzer enthalten, sind Sie Verantwortlicher im Sinne der DSGVO und Webhealth handelt als Auftragsverarbeiter nach Art. 28 DSGVO.",
            "Einen Auftragsverarbeitungsvertrag (AVV) stellen wir auf Anfrage zur Verfügung. Wenden Sie sich hierfür an die unter „Verantwortlicher und Kontakt“ genannte E-Mail-Adresse. Die Liste der eingesetzten Unterauftragsverarbeiter entspricht den oben unter „Empfänger und Auftragsverarbeiter“ genannten Anbietern.",
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
            "Wenn Sie Analytics-Cookies akzeptieren, laden wir zusätzlich das Google-Tag für Google Analytics 4 zur Reichweitenmessung der Website und PostHog-Browser-Analytics über unseren verwalteten Reverse Proxy. Wenn Sie ablehnen, bleiben diese Browser-Analytics-Tags deaktiviert.",
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
      description: "Anbieterkennzeichnung, Kontaktdaten und gesetzliche Pflichtangaben nach § 5 DDG (vormals TMG) für den Webhealth-SEO- und Analyse-Dienst von DevBrew.",
      lastUpdatedLabel: "Stand: März 2026",
      intro: [
        "Dieses Impressum enthält die Anbieterkennzeichnung nach § 5 DDG (vormals § 5 TMG), die Angaben gemäß § 18 Abs. 2 MStV und die Hinweise zur Verbraucherstreitbeilegung für Webhealth.",
      ],
      sections: [
        {
          title: "Diensteanbieter",
          paragraphs: getImpressumProviderParagraphs("de"),
        },
        {
          title: "Vertreten durch",
          paragraphs: [
            `${legalProfile.legalName} (Inhaber des Einzelunternehmens „${legalProfile.businessName}“)`,
          ],
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
        {
          title: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
          paragraphs: [
            `${legalProfile.legalName}, ${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, Deutschland.`,
          ],
        },
        ...(getDataProtectionOfficerParagraphs("de").length
          ? [
              {
                title: "Datenschutzbeauftragte/r",
                paragraphs: getDataProtectionOfficerParagraphs("de"),
              },
            ]
          : []),
        {
          title: "EU-Online-Streitbeilegung",
          paragraphs: [
            "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie unter https://ec.europa.eu/consumers/odr/ erreichen. Unsere E-Mail-Adresse für Verbraucheranfragen finden Sie oben unter „Kontakt“.",
          ],
        },
        {
          title: "Verbraucherstreitbeilegung",
          paragraphs: [getDisputeResolutionStatement("de")],
        },
        {
          title: "Haftung für Inhalte",
          paragraphs: [
            "Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.",
          ],
        },
        {
          title: "Haftung für Links",
          paragraphs: [
            "Unser Angebot enthält gegebenenfalls Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend entfernt.",
          ],
        },
        {
          title: "Urheberrecht",
          paragraphs: [
            "Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Eine Vervielfältigung, Bearbeitung, Verbreitung oder Verwertung außerhalb der Grenzen des Urheberrechts bedarf der schriftlichen Zustimmung des jeweiligen Rechteinhabers.",
          ],
        },
      ],
    },
    dpa: {
      title: "Auftragsverarbeitungsvertrag",
      description:
        "Auftragsverarbeitungsvertrag für Webhealth-Geschäftskunden, die verbundene Google-Search-Console-, Google-Analytics-4-, Crawl-, Snapshot- und Reportdaten nutzen.",
      lastUpdatedLabel: "Stand: Mai 2026",
      intro: [
        `Dieser Auftragsverarbeitungsvertrag (AVV / DPA) ist Bestandteil der Nutzungsbedingungen oder eines anderen Hauptvertrags zwischen einem Geschäftskunden, der ${legalProfile.productName} nutzt, und ${getOperatorDisplayName("de")}.`,
        "Er gilt nur, soweit Webhealth personenbezogene Daten im Auftrag eines Geschäftskunden als Auftragsverarbeiter nach Art. 28 DSGVO verarbeitet. Für Konto-, Abrechnungs-, Sicherheits-, Website-Analytics-, Produktanalyse- und Supportdaten, die Webhealth zu eigenen Zwecken verarbeitet, bleibt Webhealth eigenständig Verantwortlicher.",
      ],
      sections: [
        {
          title: "Parteien und Rollen",
          paragraphs: [
            "Der Geschäftskunde ist Verantwortlicher für Kundendaten, die an den Dienst übermittelt, mit dem Dienst verbunden oder aus dem Dienst erzeugt werden. Webhealth handelt für diese Kundendaten nur insoweit als Auftragsverarbeiter nach Art. 28 DSGVO, wie dies zur Bereitstellung des Dienstes erforderlich ist.",
            `Auftragsverarbeiter ist ${getOperatorDisplayName("de")}, ${legalProfile.streetAddress}, ${legalProfile.postalCode} ${legalProfile.city}, Deutschland. Datenschutz- und AVV-Mitteilungen können an ${getPrivacyContactEmail()} gesendet werden.`,
          ],
        },
        {
          title: "Gegenstand und Weisungen",
          paragraphs: [
            "Der Kunde weist Webhealth an, Kundendaten für die Dauer des Hauptvertrags und nur soweit zu verarbeiten, wie dies zur Bereitstellung, Absicherung, Wartung und Unterstützung des Dienstes erforderlich ist.",
            "Webhealth verarbeitet Kundendaten nur auf dokumentierte Weisung des Kunden, einschließlich Hauptvertrag, diesem AVV, der Produktkonfiguration des Kunden sowie rechtmäßigen Support- oder Löschanfragen, sofern nicht Unionsrecht oder mitgliedstaatliches Recht eine Verarbeitung verlangt.",
          ],
        },
        {
          title: "Leistungsumfang",
          bullets: [
            "Verbinden und Auslesen von Google-Search-Console- und Google-Analytics-4-Properties, die der Kunde autorisiert hat.",
            "Crawling öffentlich erreichbarer Kunden-Websites und Speicherung technischer Crawl-Ergebnisse.",
            "Erstellung von Dashboards, Snapshots, Share-Links, Exporten, deterministischen Handlungsempfehlungen und KI-gestützten Empfehlungen.",
            "Betrieb von Authentifizierung, Zugriffskontrolle, Support, Sicherheitsüberwachung, Missbrauchsprävention, Backups und operativen Logs, soweit für den Dienst erforderlich.",
          ],
        },
        {
          title: "Kategorien betroffener Personen und personenbezogener Daten",
          bullets: [
            "Betroffene Personen können insbesondere Account-Nutzer des Kunden, Teammitglieder, Agentur- oder Kundenkontakte, Absender von Supportanfragen sowie Website-Besucher oder Endnutzer des Kunden sein, die in verbundenen GSC- oder GA4-Daten abgebildet werden.",
            "Personenbezogene Daten können Namen, E-Mail-Adressen, Profilbilder, Nutzer- und Teamkennungen, IP-Adressen, User-Agents, Property-URLs, Seitenpfade, Suchanfragen, Traffic-Quellen, Länder-/Gerätemetriken, Event- oder Sitzungsmetriken, Crawl-Ergebnisse, Snapshots, KI-Prompts und -Ausgaben, Share-Link-Inhalte, Supportnachrichten und operative Logs umfassen.",
            "Kunden dürfen keine Daten besonderer Kategorien, strafrechtlich relevanten Daten, Zahlungskartendaten, amtlichen Identifikatoren oder vergleichbar sensiblen personenbezogenen Daten absichtlich übermitteln. Webhealth ist nicht für die Verarbeitung dieser Datenkategorien ausgelegt.",
          ],
        },
        {
          title: "Vertraulichkeit und Personalzugriff",
          paragraphs: [
            "Webhealth stellt sicher, dass zur Verarbeitung von Kundendaten berechtigte Personen zur Vertraulichkeit verpflichtet sind und nur zugreifen, soweit dies zur Bereitstellung, Absicherung, Unterstützung oder Wartung des Dienstes erforderlich ist.",
            "Produktionsinfrastruktur, Datenbankzugriff, Verschlüsselungsschlüssel und Administrationswerkzeuge sind auf berechtigte Personen beschränkt und durch starke Authentifizierung und Zugriffskontrollen geschützt.",
          ],
        },
        {
          title: "Technische und organisatorische Maßnahmen",
          bullets: [
            "TLS-Verschlüsselung für Datenübertragungen zwischen Browsern, Anwendungsdiensten, Auftragsverarbeitern und Drittanbieter-APIs.",
            "AES-256-GCM-Verschlüsselung von Google-OAuth-Access-Tokens, Refresh-Tokens und ID-Tokens vor Speicherung in der Datenbank.",
            "EU-gehostete selbst verwaltete PostgreSQL- und Worker-Infrastruktur bei Hetzner mit eingeschränkter Netzwerkfreigabe, authentifiziertem Administrationszugang, Backups, WAL-Archivierung und operativer Überwachung.",
            "Fehlerüberwachung ohne standardmäßige PII-Erfassung, Secret-/Token-Redaktion in Logs, Stripe-Webhook-Signaturprüfung und Crawling-Schutzmaßnahmen gegen unsichere Ziele.",
            "Verfahren zur Erkennung, Untersuchung, Minderung und Behebung personenbezogener Datenschutzverletzungen, die Kundendaten betreffen.",
          ],
        },
        {
          title: "Unterauftragsverarbeiter",
          paragraphs: [
            "Der Kunde genehmigt Webhealth allgemein den Einsatz von Unterauftragsverarbeitern, die zur Bereitstellung des Dienstes erforderlich sind. Webhealth verpflichtet Unterauftragsverarbeiter, die Kundendaten verarbeiten, zu Datenschutzpflichten, die diesem AVV materiell gleichwertig sind.",
            "Webhealth veröffentlicht Aktualisierungen auf dieser Seite oder im zugehörigen Unterauftragsverarbeiter-Abschnitt und informiert bei wesentlichen neuen Unterauftragsverarbeitern nach Möglichkeit per E-Mail oder In-App-Hinweis. Kunden können aus angemessenen datenschutzrechtlichen Gründen widersprechen; die Parteien werden dann nach Treu und Glauben an einer wirtschaftlich angemessenen Lösung arbeiten.",
          ],
          bullets: [
            "Google: OAuth-Anmeldung, Google Search Console, Google Analytics 4 und Google-Analytics-Website-Messung nach Einwilligung.",
            "Vercel: Hosting und Auslieferung der Webanwendung sowie cookielose Vercel Analytics.",
            "Hetzner: selbst verwaltete PostgreSQL-Datenbank, Worker-Infrastruktur, Backups, Monitoring und selbst gehostete Dienste in der EU.",
            "OpenAI: KI-gestützte Snapshot- und Empfehlungsverarbeitung sowie importierte OpenAI-Abrechnungsauswertungen, sofern konfiguriert.",
            "Stripe: Kundenprofile, Abonnementverarbeitung, Billing-Portal und transaktionale Abrechnungskommunikation.",
            "PostHog: optionale serverseitige Produktanalyse über die EU-Instanz.",
            "GlitchTip: selbst gehostete Fehlerüberwachung auf Hetzner-Infrastruktur ohne Übermittlung an einen von GlitchTip gehosteten Drittservice.",
          ],
        },
        {
          title: "Internationale Übermittlungen",
          paragraphs: [
            "Einige Unterauftragsverarbeiter können Kundendaten außerhalb der EU/des EWR verarbeiten oder zugänglich machen, einschließlich in den Vereinigten Staaten. Dies kann je nach Servicefluss und deren Unterauftragsverarbeitern insbesondere Google, OpenAI, Stripe, Vercel und PostHog betreffen.",
            "Soweit erforderlich, stützt Webhealth solche Übermittlungen auf Angemessenheitsbeschlüsse, das EU-U.S. Data Privacy Framework, soweit anwendbar, Standardvertragsklauseln und ergänzende Schutzmaßnahmen, die für die jeweilige Übermittlung angemessen sind.",
          ],
        },
        {
          title: "Betroffenenrechte und Compliance-Unterstützung",
          paragraphs: [
            "Unter Berücksichtigung der Art der Verarbeitung und der Webhealth verfügbaren Informationen leistet Webhealth angemessene Unterstützung bei Pflichten des Kunden zu Betroffenenanfragen, Datenschutz-Folgenabschätzungen, Konsultationen mit Aufsichtsbehörden und Sicherheitsanfragen.",
            "Erhält Webhealth eine Betroffenenanfrage zu Kundendaten, informiert Webhealth den Kunden, soweit rechtlich zulässig, und beantwortet die Anfrage nicht im Namen des Kunden, außer auf dokumentierte Weisung oder wenn dies gesetzlich vorgeschrieben ist.",
          ],
        },
        {
          title: "Personenbezogene Datenschutzverletzungen",
          paragraphs: [
            "Webhealth informiert den Kunden unverzüglich, nachdem Webhealth Kenntnis von einer personenbezogenen Datenschutzverletzung erlangt hat, die Kundendaten betrifft, und stellt angemessen verfügbare Informationen bereit, damit der Kunde seine Meldepflichten erfüllen kann.",
            "Webhealth ergreift angemessene Maßnahmen zur Untersuchung, Minderung und Behebung solcher Vorfälle unter Berücksichtigung der Art des Dienstes und der Webhealth verfügbaren Informationen.",
          ],
        },
        {
          title: "Löschung und Rückgabe",
          paragraphs: [
            "Nach Ende des Dienstes oder einer wirksamen Löschanfrage löscht Webhealth aktive Produktionskopien der Kundendaten innerhalb von 30 Tagen, sofern keine weitere Aufbewahrung aufgrund von Recht, Sicherheit, Streitbeilegung oder berechtigten operativen Erfordernissen notwendig ist.",
            "Backup-Kopien sind gegen gewöhnlichen Zugriff geschützt und laufen nach dem normalen Backup-Aufbewahrungszyklus aus, sofern keine Wiederherstellung aus Sicherheits-, Kontinuitäts- oder Rechtsgründen erforderlich ist. Werden Backups wiederhergestellt, werden gelöschte Kundendaten, soweit technisch möglich, erneut gelöscht.",
          ],
        },
        {
          title: "Audits und Nachweise",
          paragraphs: [
            "Webhealth stellt Informationen bereit, die angemessenerweise erforderlich sind, um die Einhaltung dieses AVV nachzuweisen, üblicherweise durch Dokumentation, Sicherheitszusammenfassungen, schriftliche Antworten oder gleichwertige Unterlagen.",
            "Direkte Audits oder Inspektionen sind nur verfügbar, soweit gesetzlich erforderlich, angemessen, auf Kundendaten beschränkt, vertraulich, mit angemessener Vorankündigung geplant und grundsätzlich höchstens einmal pro Kalenderjahr, sofern keine bestätigte personenbezogene Datenschutzverletzung eine zusätzliche Prüfung rechtfertigt.",
          ],
        },
        {
          title: "Laufzeit, Vorrang und Recht",
          paragraphs: [
            "Dieser AVV gilt, solange Webhealth Kundendaten im Auftrag des Kunden verarbeitet. Bei Widersprüchen zwischen diesem AVV und dem Hauptvertrag geht dieser AVV für die Verarbeitung von Kundendaten vor.",
            `Dieser AVV unterliegt deutschem Recht. Für Geschäftskunden sind, soweit gesetzlich zulässig, die für ${legalProfile.city}, Deutschland, zuständigen Gerichte zuständig.`,
          ],
        },
      ],
    },
  },
} satisfies LegalDictionary;
