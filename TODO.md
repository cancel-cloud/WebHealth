# TODO — Placeholder / Dummy Data Tracker
- Upgrade to pro get 5x the value!




# DONE
- When retrying a report, the worker skipped AI generation because aiReportJson was still set — fixed by clearing aiReportJson/data/detailsCostUsd in the retry route
- Duplicate "Queueing your report…" text above submit button removed; spinner now lives inside the button only
- GET /api/properties/gsc_https:/fds.devbrew.dev/data-range 404 — fixed by wrapping propertyId with encodeURIComponent in the data-range fetch
- Settings Agency card button replaced with Button component (variant="outline") with mt-auto to align with Free/Pro cards
- Marketing pricing page Agency card now same height as Free card (items-stretch + h-full on card)
- New Report dialog property picker no longer auto-reopens on subsequent focus — hasAutoOpenedRef resets only when dialog opens
- Generate Report button shows "Checking your data…" with slow spinner while data-range loads, and is disabled during that time
- After re-enqueuing a failed report, only the requeuing report sonner is sent and that the requeueung was sucessfull, but not the promise sonner that the woker is still working on the report
- PATCH /api/properties/gsc_https:/www.kvd-communication.com/link-ga4 404 in 48ms
  - idk what is happening
  - add a search bar in the properties page
- Add loading when user is in the "Create Comparison report" popup so he knows that something is happening when he clicks on "Generate Report"
- We need to refresh the users plan more
  - Currently a user can cancel and if not refresh the settings page, we do not update the UI to reflect their real usage stats.
- Disable cost display in reports page for all users exept the admins
  - Don't even send that element to the users so they dont see it in the DOM or anywhere else
- when a user click "Get details" on reports page, but that click is a above the users limit, he gets an error sonner, which is good, but the sonner that the queueing of this details is not removed and will stay displaying "Generating details for "s fk"…"
- In Settings introduce a skeleton that has the same layout of the plan stuff in the sitebar and the plan details on the right side
- Branding guidelines idk wtf to do here
- In settings the butons upgrade/downgrade buttons are not on the same hight