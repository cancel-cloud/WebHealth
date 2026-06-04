# TODO — Placeholder / Dummy Data Tracker
- cal now hosted in EU
  - https://cal.eu/lukas-dienst/webhealth-pilot-check
  - Need change of data privacy policy and so on

- darkmode medium ugly

- wissensdatenbank
  - Completed: `gsc-ga4-agentur-reporting-monatscall`
    - German: `/de/wissen/gsc-ga4-agentur-reporting-monatscall`
    - English: `/en/resources/gsc-ga4-agentur-reporting-monatscall`
  - Next page to create: `webhealth-vs-looker-studio`
    - Purpose: bottom-funnel comparison page for visitors asking why Looker Studio dashboards are not enough.
    - Route intent: localized comparison page, likely `/de/vergleich/webhealth-vs-looker-studio` and `/en/compare/webhealth-vs-looker-studio`.
  - Then create `fuer-wen-webhealth-passt`
    - Purpose: pilot-fit qualification page before demo or booking CTAs.
    - Route intent: localized pilot page, likely `/de/pilot/fuer-wen-webhealth-passt` and `/en/pilot/who-webhealth-fits`.
  - Then create `automatisierte-seo-reports-agentur`
    - Purpose: address the manual reporting time pain after the conversion spine is stronger.
  - Then create `warum-seo-dashboards-keine-naechsten-schritte-liefern`
    - Purpose: supports the Looker Studio comparison and WebHealth decision-layer positioning.
  - Then create `monatsreport-seo-kunden-vorlage-agentur`
    - Purpose: lead-magnet/template page; needs a checklist or template asset before it is most useful.
  - Then create `seo-verluste-frueh-erkennen-agentur`
    - Purpose: useful monitoring topic, but less central to the immediate conversion path than the pages above.
  - Future downloadable asset: German Monatscall checklist
    - Create a polished German DOCX source using the document skill.
    - Export it to PDF and visually verify every page before publishing.
    - After approval, place the final PDF in the public website assets and add a download CTA to the GSC + GA4 article.
    - Do not block the article launch on this asset; English PDF remains a later follow-up.

- auto merging properties is not doing one thing


- idk why, but default data fetch is 28 days(i think) but when toggleing to view last 90 days, it fetches 28 days worth of data and shows the rest as 0, even though there is data available (but in the cloud aka not fetched from google)
  - it does not show, that there is more data available than just the 28 days fetched, nor does it sync and show that(I WANT IT AUTO SYNC and show that it is doing that right now(use the already existing loading indicator on that page))

- Agency workspace model:
  - Keep the team/workspace abstraction because Agency needs one owner-owned workspace with invited members later.
  - Make membership the source of truth for roles (`owner`, later `admin`/`member`/`developer`) instead of duplicating ownership in multiple places.
  - Agency members should eventually contribute their connected GSC/GA4 properties into the shared agency workspace.
  - Active property toggles, dashboards, billing limits, branding, and issue claiming should be workspace-scoped, controlled by owner/admin roles.
  - Do not build invite/member management before launch; keep the schema direction clean enough that it can be added after real usage.
- Ranked fixes are currently deterministic, not AI-driven. Full AI-ranked-fix implementation and per-user AI cost ledger are still open work.
- FAQ "How does per-client pricing work on Agency?" in there its noted that its missing implementation - which it is, we need that fully implemented
