# TODO — Placeholder / Dummy Data Tracker

- Ranked fixes are currently deterministic, not AI-driven. Full AI-ranked-fix implementation and per-user AI cost ledger are still open work.
- FAQ "How does per-client pricing work on Agency?" in there its noted that its missing implementation - which it is, we need that fully implemented
- Upgrade to pro get 5x the value!
- 
- YT-Short testing?

- Posthog Dashboard is missing completly + posthog install check!


# DONE
- GET /api/properties/gsc_https:/fds.devbrew.dev/data-range 404 — fixed by wrapping propertyId with encodeURIComponent in the data-range fetch
- Settings Agency card button replaced with Button component (variant="outline") with mt-auto to align with Free/Pro cards
- Marketing pricing page Agency card now same height as Free card (items-stretch + h-full on card)
- PATCH /api/properties/gsc_https:/www.kvd-communication.com/link-ga4 404 in 48ms
  - idk what is happening
  - add a search bar in the properties page
- We need to refresh the users plan more
  - Currently a user can cancel and if not refresh the settings page, we do not update the UI to reflect their real usage stats.
- In Settings introduce a skeleton that has the same layout of the plan stuff in the sitebar and the plan details on the right side
- Branding guidelines idk wtf to do here
- In settings the butons upgrade/downgrade buttons are not on the same hight
- Screenshot 30.03.2026
- If a user on the sign-in flow disagrees to share its properties, we simply show a default sync failed error and no explanation why that could have happened. And we've got no way to fix that for the user, because the user can sign out and simply can sign in. And if he doesn't tick the two boxes that are unticked by default, I don't know why, we can't get his properties.
make snapshot timeframes adjustable where the live-dashboard model still assumes fixed windows
- revamp the plan to adjust for the timeframe display

- hompage is still not as /Users/cancelcloud/Developer/DevBrew/WebHealth/refrences/Agency Landing.html !!!
- You can't open anything in the dashboard

- What about the admin items? do they respect the drastic changes?

- there is no dedicated page for the agency branding stuff like name, contact, icon
- run missing migrations against local db, if there are any
- update the .env.example and clean them up(worker and frontend)
- auto-data fetcher for live dashboards
