# GlitchTip Error Handling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Goal:** Add self-hosted error collection with GlitchTip, keep safe user-facing error handling in WebHealth, and standardize client-side action error reporting.
>
> **Architecture:** Keep the current hybrid UX. Recoverable request and mutation failures continue to surface through Sonner, while fatal render/runtime failures continue to use Next.js error boundaries. Unexpected client, server, and boundary errors are reported through the Sentry-compatible Next.js SDK to a self-hosted GlitchTip instance running beside the backend.
>
> **Tech Stack:** Next.js App Router, React 19, Sonner, `@sentry/nextjs` configured against GlitchTip, existing route error shaping in `apps/web/src/lib/server/route-security.ts`.

---

## Decisions Locked

- Use **GlitchTip** as the self-hosted collector and admin UI.
- Keep **Sonner** for user-visible recoverable errors.
- Keep **Next.js error boundaries** for fatal render/navigation failures.
- Do **not** build a custom in-app log viewer in WebHealth.
- Roll out incrementally: infrastructure and SDK first, then migrate the highest-value client flows to the shared request helper.

## Task 1: Add monitoring dependencies and runtime configuration

**Files:**
- Modify: `apps/web/package.json`
- Modify: `.env.example`
- Modify: `apps/web/.env.example`
- Modify: `CLAUDE.md`

**Implementation:**
- Add `@sentry/nextjs` to `apps/web`.
- Add GlitchTip/Sentry DSN env variables for browser and server runtime.
- Document the expected GlitchTip base URL, DSN source, and the rule that GlitchTip runs as a separate service on the same server, not inside the Next.js process.
- Update local notes so development uses the existing localcan HTTPS origin for any browser-side reporting tests.

**Acceptance criteria:**
- The repo documents all required env vars.
- The dependency is installed only in `apps/web`.
- The plan for local and production DSN wiring is explicit.

## Task 2: Wire the Next.js SDK to GlitchTip

**Files:**
- Create or modify the Next.js Sentry bootstrap files in `apps/web` following the current official SDK layout for Next.js App Router.
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/src/app/error.tsx`
- Modify: `apps/web/src/lib/server/route-security.ts`

**Implementation:**
- Initialize the Sentry-compatible SDK for browser, server, and edge/app-router execution contexts, using the GlitchTip DSN.
- Wrap `apps/web/next.config.ts` with the Sentry Next.js integration exactly as required by the current SDK version.
- In `apps/web/src/app/error.tsx`, report boundary errors before rendering the existing fallback UI.
- In `apps/web/src/lib/server/route-security.ts`, report unexpected route exceptions before returning the existing sanitized JSON response.
- Preserve the current safe public error contract from `packages/shared/src/lib/http-errors.ts`.

**Acceptance criteria:**
- A thrown route-handler exception is still returned to the user as a safe JSON error, but also creates a GlitchTip event.
- A fatal App Router error still shows the current error screen, but also creates a GlitchTip event.
- No user-facing copy regresses.

## Task 3: Introduce a shared client request/error layer

**Files:**
- Create: `apps/web/src/lib/client/app-error.ts`
- Create: `apps/web/src/lib/client/report-error.ts`
- Create: `apps/web/src/lib/client/api.ts`

**Implementation:**
- Create a normalized client error type with:
  - `message`
  - `code`
  - `status`
  - optional `cause`
- Implement a browser-side request helper around `fetch()` that:
  - parses JSON safely
  - extracts existing `{ error, code, message }` payloads
  - throws the normalized client error for handled failures
  - reports unexpected failures to GlitchTip
- Implement a small reporting helper that:
  - sends unexpected exceptions to GlitchTip
  - avoids duplicate reporting for already-normalized handled errors
  - leaves toast wording control to the caller

**Acceptance criteria:**
- Client mutations and request polling can share one error normalization path.
- Unexpected network/parsing/runtime failures are reportable without duplicating per-component reporting code.
- Existing routes do not need response-shape rewrites.

## Task 4: Migrate representative high-value user flows

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/new-report-dialog.tsx`
- Modify: `apps/web/src/app/reports/[id]/sections/get-details-button.tsx`
- Modify: `apps/web/src/app/(settings)/settings/page.tsx`

**Implementation:**
- Replace direct ad hoc `fetch()` handling in those flows with the shared client request helper.
- Keep the existing success/loading/error Sonner behavior where it is already product-specific.
- Remove duplicated generic error parsing where the shared helper now owns it.
- Ensure handled plan-limit and domain-specific cases continue to show tailored messaging and actions.

**Acceptance criteria:**
- Report creation, deep-dive generation, and one settings mutation all use the shared helper.
- Handled business cases still show the same or better UX.
- Unexpected failures no longer require each component to invent its own fallback logic.

## Task 5: Add focused tests for the new shared logic

**Files:**
- Create: `apps/web/src/lib/client/app-error.test.ts`
- Create: `apps/web/src/lib/client/api.test.ts`
- Create: `apps/web/src/lib/client/report-error.test.ts`

**Implementation:**
- Use the repo’s colocated `node:test` style.
- Test success, handled API failure, invalid JSON, and network failure cases for the request helper.
- Test that normalized handled errors are not double-reported.
- Test that unknown exceptions are forwarded to the reporting layer.

**Acceptance criteria:**
- The new shared client logic is covered without requiring heavy component-level tests.
- The tests document the error contract expected by migrated components.

## Task 6: Verify integration manually

**Run:**
- `pnpm --filter @webhealth/web eslint apps/web/src/lib/client/app-error.ts apps/web/src/lib/client/report-error.ts apps/web/src/lib/client/api.ts 'apps/web/src/app/(app)/dashboard/new-report-dialog.tsx' 'apps/web/src/app/reports/[id]/sections/get-details-button.tsx' 'apps/web/src/app/(settings)/settings/page.tsx' apps/web/src/app/error.tsx apps/web/src/lib/server/route-security.ts`
- Targeted `node --test` commands for the new `*.test.ts` files
- `pnpm dev`

**Manual checks:**
- Trigger a handled API failure and confirm:
  - the user sees one Sonner error
  - no raw stack trace appears in the UI
- Trigger a route exception and confirm:
  - the browser receives a safe API error payload
  - the event appears in GlitchTip
- Trigger a render/runtime error and confirm:
  - the existing boundary UI renders
  - the event appears in GlitchTip
- Trigger one migrated flow success case and confirm existing success/loading Sonners still behave correctly.

## Infrastructure Notes

- Host GlitchTip on the same server as the backend, but as a separate service stack behind the same reverse proxy.
- Prefer a dedicated subdomain such as `errors.<your-domain>`.
- Keep GlitchTip authentication and admin access outside the WebHealth app session model for v1.
- The current CSP in `apps/web/next.config.ts` already allows `connect-src https:`. Re-check before changing it; do not widen CSP unless the actual GlitchTip/browser setup requires it.

## Defaults And Non-Goals

- Do not replace the root error page with toast-only handling.
- Do not try to catch every arbitrary client runtime failure and continue rendering.
- Do not build a custom admin logs screen in WebHealth.
- Do not migrate every client `fetch()` call in the first pass; land the shared helper and convert the highest-value flows first.

## GlitchTip Endpoint
Connect your Web-App project to GlitchTip
Installation guide
Install @sentry/nextjs into your Next.js project:

npm install --save @sentry/nextjs
Run the Sentry Wizard and provide your GlitchTip URL:

npx @sentry/wizard --url=https://your-server-url
Try it out
Following the wizard's instructions will connect your app to GlitchTip. You can verify GlitchTip is now monitoring your app by adding a link that will generate a simple error:

<button onClick="{()" =""> { throw Error("Generic Error Message"); }} className={styles.card} > Generic Error Message </button>
Then check your GlitchTip Issues page to see the error.

Configuration
SDK options are set in two separate config files:

sentry.server.config.js and sentry.client.config.js (or .ts for TypeScript)

Both files may contain the same values, or be set differently.

import * as Sentry from "@sentry/nextjs";
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: SENTRY_DSN || "YOUR GLITCHTIP DSN HERE",
});
Configuration options include:

dsn - Where to send event data to, found in GlitchTip in project settings.
release - For versioning the source maps that are uploaded when you run build for your project. An arbitrary release ID will be generated automatically, but you may choose to determine the name through an environment variable.
environment - The running environment name, such as "production". Set to process.env.NODE_ENV by default.
sampleRate - Percent of error events to send to GlitchTip. 0.5 would be 50%. Defaults to 1.0.
tracesSampleRate - Percent of performance transactions to send to GlitchTip, set to a number betweeon 0 and 1. 0.01 would be 1%. We recommend a lower value to save costs/hard drive space.
Performance Monitoring
You can send performance transactions to GlitchTip to monitor your app's speed. In your sentry.server.config.js and sentry.client.config.js files, set the tracesSampleRate variable to a number between 0 and 1. This will determine what percentage of transactions are sent to GlitchTip.

import * as Sentry from "@sentry/nextjs";
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: SENTRY_DSN || "YOUR GLITCHTIP DSN HERE",
  tracesSampleRate: 0.1,
});
API routes
To support Next.js API routes, wrap the routes in your next.config.js file as seen here.

import { withSentry } from "@sentry/nextjs";

function handler(req, res) {
  res.status(200).json({ bar: "foo" });
}

export default withSentry(handler);
How to set up client tunnel
Sometimes client side error reporting could be blocked by 3rd party tools. To solve this, you need to set up a client tunnel through your own API route.

You must set up the endpoint with a tunnel yourself. This is only needed for client as server and edge errors will be sent from serverside avoiding this issue.

Steps to create a tunnel:
Create an API route in your Next.js project
Configure client to use this tunnel
Here is a minimal example of an API route for Pages router:

// pages/api/glitchtip-tunnel.js
export default async function handler(req, res) {
  const url = `${YOUR_SERVER_INSTANCE}/api/${YOUR_PROJECT_ID}/envelope/?sentry_version=7&sentry_key=${YOUR_SECRET_KEY}&sentry_client=sentry.javascript.nextjs%2F9.2.0`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        Accept: "*/*",
      },
      body: req.body,
    });

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("GlitchTip tunnel error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
Required variables:
YOUR_SERVER_INSTANCE: URL of your GlitchTip instance (e.g., https://app.glitchtip.com). Be careful with trailing slashes!

YOUR_PROJECT_ID: Your project ID number. Find it in your project URL. Example: if your URL is https://app.glitchtip.com/your-organization/issues?project=1, then your ID is 1.

YOUR_SECRET_KEY: Found in your Security Endpoint in the glitchtip_key query parameter. Example: if your security URL is https://app.glitchtip.com/api/1/security/?glitchtip_key=123ab12ab1234a1abcde12abcdef123a, then your key is 123ab12ab1234a1abcde12abcdef123a.

Configure client to use your tunnel:
In your sentry.client.config.js file, add the tunnel option:

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1,
  tunnel: "/api/glitchtip-tunnel", // Path to your API route
});
This will route all error reports through your own API endpoint, bypassing ad blockers.

Automatic upload of source maps on build
You will need to set productionBrowserSourceMaps: true in your next.config.js (or .ts for TypeScript) in order for Next.js to keep the source maps and automatically trigger uploading of source maps on build using SentrySDK. Then you need to pass parameters into withSentryConfig. This works for Vercel builds as well without setting up Sentry integration.

Here is an example:

withSentryConfig(module.exports, {
  authToken: YOUR_AUTH_TOKEN,
  org: YOUR_ORGANIZATION_SLUG,
  project: YOUR_PROJECT_SLUG,
  sentryUrl: YOUR_SERVER_INSTANCE,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
});
YOUR_AUTH_TOKEN - Token that you can generate in profile section.

YOUR_ORGANIZATION_SLUG - Could be found in your glitchtip url. Usually it is lowercase name of organization where spaces replaced with dashes.

YOUR_PROJECT_SLUG - This is a bit trickier to find. Usually it's a lowercase name of your project with dashes instead of spaces. You can use api endpoint to list all your projects with their names /api/0/projects/. You will need to use your YOUR_AUTH_TOKEN to authorize the request.

YOUR_SERVER_INSTANCE - Same as before, it's a url of your instance.

DSN
Most instructions will have a spot that says "YOUR-GLITCHTIP-DSN-HERE". Copy the DSN and paste it into that spot.

DSN
https://b737ceb38c4a4cd587237600d833ce0f@glitchtip.devbrew.dev/1
Security Endpoint
https://glitchtip.devbrew.dev/api/1/security/?glitchtip_key=b737ceb38c4a4cd587237600d833ce0f
What's this all about?
To start using GlitchTip, you need to:

Install a library into your project so it is able to send events to GlitchTip.
Configure it with a Data Source Name (DSN) so it knows where exactly to send events. Your DSN is below, and can also be found in the project's settings.
Initialize the library with your DSN to start sending events.
General Configuration
Consult your platform's Sentry SDK's documentation for more information. Most support:

dsn - Where to send event data too, found in GlitchTip in project settings.
release - Set release name such as "1.0".
environment - Set the running environment name, such as "production".
This page is showing instructions on how to connect GlitchTip to your project based on the platform you specified.
