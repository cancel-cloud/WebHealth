# GlitchTip Monitoring

This document describes the current GlitchTip setup in WebHealth as implemented in the repository today.

## Scope

WebHealth currently uses GlitchTip for error monitoring.

Included:

- `apps/web` browser, server, edge, and route-handler error reporting
- handled artifact-download infrastructure failures in `apps/web`
- fatal `apps/worker` startup/runtime crash reporting

Not included:

- performance monitoring
- browser tunnel/proxy endpoint
- source map upload configuration
- session replay

## Current Wiring

### Web (`apps/web`)

Runtime bootstrap:

- `apps/web/instrumentation.ts`
- `apps/web/instrumentation-client.ts`
- `apps/web/sentry.server.config.ts`
- `apps/web/sentry.edge.config.ts`
- `apps/web/next.config.ts`

Error capture points:

- `apps/web/src/app/error.tsx`
- `apps/web/src/app/global-error.tsx`
- `apps/web/src/lib/client/report-error.ts`
- `apps/web/src/lib/server/route-security.ts`
- `apps/web/src/app/api/reports/[id]/download/route.ts`

### Worker (`apps/worker`)

Runtime bootstrap:

- `apps/worker/src/monitoring.ts`
- `apps/worker/src/main.ts`

The worker reports fatal startup/runtime crashes before exiting. This includes failures during the direct DB bootstrap phase used by worker startup migrations.

## Environment Variables

### Web

Required:

```env
SENTRY_DSN=https://<public_key>@<glitchtip-host>/<project_id>
NEXT_PUBLIC_SENTRY_DSN=https://<public_key>@<glitchtip-host>/<project_id>
```

Optional:

```env
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
```

Notes:

- `NEXT_PUBLIC_SENTRY_DSN` is intentionally public and is safe to expose to the browser.
- `SENTRY_DSN` is used by server and edge code and can match the same DSN.
- `SENTRY_ENVIRONMENT` falls back to `NODE_ENV` if unset.
- `SENTRY_RELEASE` is optional and is only used if you set it.

### Worker

Recommended:

```env
SENTRY_DSN=https://<public_key>@<glitchtip-host>/<project_id>
```

Optional:

```env
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
```

Notes:

- The worker does not need `NEXT_PUBLIC_SENTRY_DSN`.
- If `SENTRY_DSN` is missing in the worker, worker crashes are only logged to stderr and are not sent to GlitchTip.

## What Is Reported

### Web

The web app reports:

- fatal render failures through `error.tsx`
- fatal shell-level failures through `global-error.tsx`
- unexpected client request/network/parsing failures from the shared client API layer
- unexpected route-handler exceptions via `handleRouteError(...)`
- handled artifact download infrastructure failures when the worker is unreachable or returns a non-success response

### Worker

The worker reports:

- fatal startup crashes
- fatal runtime crashes
- direct DB bootstrap failures during `ensureWorkerDatabaseReady()`

Worker fatal events are tagged with:

- `error_surface=worker`
- `worker_phase=<phase>`

When the worker fails during direct DB bootstrap, the event context includes:

- `target=direct-database`

## What Is Not Reported

The current setup intentionally does not report:

- normal handled 4xx application errors
- `ARTIFACT_NOT_FOUND` download responses
- performance transactions
- source map upload metadata

Performance monitoring is currently disabled because `tracesSampleRate` is set to `0` in the web and worker GlitchTip/Sentry initialization.

## Local Verification

Use the HTTPS localcan origin, not `http://localhost:3000`.

Local browser/auth note:

- `https://webaudit-79.localcan.dev`

### Browser smoke test

1. Set:

```env
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ENVIRONMENT=development
```

2. Start the app and open `https://webaudit-79.localcan.dev`.
3. Trigger a deliberate client-side error.
4. Confirm the issue appears in GlitchTip.

### Route smoke test

Trigger a deliberate exception in an API route that uses `handleRouteError(...)`.

Expected:

- the route still returns a sanitized error payload
- GlitchTip receives the exception

### Artifact download smoke test

Trigger a report download while the artifact worker is unreachable or misconfigured.

Expected:

- the download endpoint returns a safe `502` or `503` payload
- GlitchTip receives an event tagged as a handled route failure

### Worker crash smoke test

Start the worker with `SENTRY_DSN` configured and break worker startup, for example by making the direct migration database unreachable.

Expected:

- the worker logs a fatal crash and exits
- GlitchTip receives a worker event with `worker_phase=database-ready`

## Operational Notes

- Browser event delivery can still be blocked by ad blockers because no client tunnel is configured.
- There is no automatic source map upload setup in the repository yet.
- `SENTRY_RELEASE` is supported by the code, but the repo does not currently auto-populate it.

## Related Files

- `.env.example`
- `apps/web/.env.example`
- `apps/worker/.env.example`
- `docs/deploy-runbook.md`
- `docs/coolify-worker-deploy.md`
- `CLAUDE.md`
