# WebHealth Security Best Practices Review

Date: 2026-03-06

## Executive Summary

This review focused on the Next.js app, shared backend code, and worker process. I found three high-severity issues and several medium-severity control gaps. The highest-risk problems are:

1. Worker-side SSRF exposure during report crawling.
2. Plaintext storage of Google OAuth tokens in the database.
3. Untrusted URLs rendered directly into clickable links in the report UI.

The codebase already has some useful security building blocks: most data routes require a session, report downloads re-check team membership before returning artifacts, artifact keys are path-validated, and `.env*` files do not appear to be tracked in git. The main weaknesses are around outbound trust boundaries, secret handling, authorization depth, and defense-in-depth browser protections.

## Scope Reviewed

- `apps/web`
- `apps/worker`
- `packages/shared`

## Findings

### SEC-01 High: Worker crawler can be used as an SSRF primitive

Impact: If an attacker can get an internal or sensitive URL into a property record, the worker can fetch internal services, metadata endpoints, or other non-public resources.

Evidence:

- `packages/shared/src/lib/crawl.ts:28-37` fetches arbitrary URLs with `fetch(url, ...)` and no hostname/IP guard.
- `packages/shared/src/lib/crawl.ts:60-80` accepts `startUrl` directly and normalizes only `sc-domain:` inputs.
- `packages/shared/src/lib/queue/report-worker.ts:705-706` calls `crawlWebsite(property.url, 120)` during report generation.

Why this is insecure:

- There is no allowlist for schemes or hosts.
- There is no rejection of loopback, RFC1918, link-local, or cloud metadata IP ranges.
- The worker is exactly the wrong place to trust arbitrary URLs because it usually has broader network reach than the public app.

Improvement plan:

- Only allow `https:` and optionally `http:` for explicitly approved development environments.
- Resolve DNS before fetch and block loopback, private, link-local, multicast, and metadata ranges.
- Enforce that crawl targets match the verified property host/domain instead of trusting `property.url` blindly.
- Add infrastructure egress controls so the worker cannot reach internal networks even if application validation fails.

### SEC-02 High: Google OAuth tokens are stored in plaintext

Impact: A database leak, replica exposure, backup leak, or overly broad admin access would immediately expose reusable Google credentials with Search Console and Analytics scopes.

Evidence:

- `packages/shared/src/db/schema.ts:39-55` stores `access_token`, `refresh_token`, and `id_token` as plain `text` columns.
- `packages/shared/src/lib/auth.ts:16-27` requests offline Google access and broad scopes.
- `packages/shared/src/lib/auth.ts:60-69` passes raw tokens into sync flows.
- `packages/shared/src/lib/sync-properties.ts:27-37` writes refreshed access tokens back into the database verbatim.

Why this is insecure:

- These are long-lived or reusable third-party credentials.
- There is no visible application-layer encryption or token vaulting.
- Token compromise would let an attacker access customer Search Console and GA4 data outside the app.

Improvement plan:

- Encrypt provider tokens before persistence with envelope encryption or a dedicated secret-management layer.
- Separate access-token caching from refresh-token storage and minimize what is retained.
- Restrict which services/processes can read token-bearing tables.
- Rotate existing Google credentials after introducing safer storage.

### SEC-03 High: Untrusted report URLs are rendered into clickable links without protocol validation

Impact: A crafted `javascript:` or `data:` URL in report detail data could execute script when an authenticated user clicks it.

Evidence:

- `apps/web/src/app/reports/[id]/sections/action-detail-modal.tsx:56-65` renders `parsed.affectedUrls` directly into `<a href={url}>`.
- `apps/web/src/app/api/reports/[id]/generate-detail/route.ts:142-155` instructs the model to return `affectedUrls` from report issue data.

Why this is insecure:

- `affectedUrls` are derived from crawl data, report data, and model output.
- There is no `http:`/`https:` protocol allowlist before rendering.
- `rel="noopener noreferrer"` protects the opener, not the URL scheme itself.

Improvement plan:

- Validate URLs before rendering and reject any non-HTTP(S) scheme.
- Normalize links through a shared safe-URL helper.
- Treat AI-derived URLs as untrusted input everywhere in the UI.

### SEC-04 Medium: “Restricted” users are not actually restricted server-side

Impact: An admin can mark a user as restricted, but that user can still call normal authenticated APIs and continue using the product.

Evidence:

- `apps/web/src/app/api/admin/users/[userId]/route.ts:28-37` lets admins set `isRestricted` and `restrictionMessage`.
- `apps/web/src/app/(app)/layout.tsx:15-30` only reads that flag to show a toast/notice.
- Representative authenticated routes such as `apps/web/src/app/api/reports/route.ts:42-64` and `apps/web/src/app/api/properties/sync/route.ts:7-35` check only for a session and do not enforce `isRestricted`.

Why this is insecure:

- The UI implies a suspension or feature restriction capability that is not enforced by the backend.
- A blocked user can continue creating reports, syncing properties, and consuming external/provider resources.

Improvement plan:

- Introduce a shared server-side guard for restricted users and apply it to write/cost-bearing routes first.
- Decide whether restriction means full suspension or partial feature denial and encode that centrally.

### SEC-05 Medium: Any authenticated team member can spend shared provider credentials and backend capacity

Impact: A normal team member can trigger work that uses the team owner’s Google credentials and burns queue/OpenAI capacity without a role check or visible plan quota enforcement.

Evidence:

- `packages/shared/src/db/schema.ts:77-86` distinguishes team roles (`owner`, `member`).
- `apps/web/src/app/api/reports/route.ts:42-64` allows any authenticated team user to create a report.
- `apps/web/src/app/api/reports/route.ts:102-128` then loads the team owner’s Google account and uses those tokens for metrics preflight.
- `apps/web/src/app/api/reports/[id]/generate-detail/route.ts:157-205` increments `detailsRequestCount` and spends OpenAI tokens before any visible cap or rate limit check.

Why this is insecure:

- The app is treating “authenticated team member” as sufficient authority for expensive and externally authenticated actions.
- Plan settings exist in the schema, but I did not find a clear enforcement point on report creation/detail generation in the reviewed paths.

Improvement plan:

- Define which actions require `owner` or elevated roles.
- Enforce per-team and per-user quotas before queueing work or calling OpenAI.
- Add rate limits to `generate-detail`, report creation, and sync endpoints.

### SEC-06 Medium: No app-level CSP or baseline security headers are visible in the repo

Impact: The browser has less defense-in-depth against XSS, clickjacking, MIME sniffing, and overly broad referrer leakage.

Evidence:

- `apps/web/next.config.ts:3-7` defines no `headers()` policy.
- `apps/web/src/app/layout.tsx:30-45` adds theme-color metadata but no visible CSP or security-header configuration.

Why this matters:

- These headers are often set at the edge, but nothing in app code shows a baseline policy.
- Without a visible policy, it is easy for production to drift into a weaker posture than intended.

Improvement plan:

- Add a documented baseline for CSP, `X-Content-Type-Options`, clickjacking protection, and `Referrer-Policy`.
- If headers are set in infrastructure, codify them in deployment docs and verify them at runtime.

### SEC-07 Medium: Internal exception messages are returned to clients, and raw errors are logged broadly

Impact: Users and logs may receive database/provider/runtime details that help attackers map internals or expose sensitive operational context.

Evidence:

- `apps/web/src/app/api/reports/route.ts:163-166` returns `error.message` on 500.
- `apps/web/src/app/api/reports/[id]/download/route.ts:51-53` returns `error.message` on 500.
- `apps/web/src/app/api/admin/sync/route.ts:288-291` returns `error.message` on 500.
- `apps/web/src/app/api/properties/sync/route.ts:38-46` logs raw errors and may return provider error text.
- `packages/shared/src/lib/queue/report-worker.ts:155-177` logs raw error objects through `console.error(line, error)`.
- `packages/shared/src/lib/queue/report-worker.ts:1464-1489` passes full worker errors into retry/fatal logging.

Why this is insecure:

- Third-party SDK and database errors often include response bodies, identifiers, SQL details, or stack traces.
- Returning them to clients creates unnecessary information disclosure.

Improvement plan:

- Return generic 5xx messages to clients and keep detailed diagnostics in structured, redacted server logs.
- Standardize an error wrapper so only safe error codes/messages cross the HTTP boundary.
- Redact provider tokens, request bodies, and SQL details from worker logs.

### SEC-08 Medium: Worker artifact service relies on one static shared bearer secret

Impact: If `WORKER_API_SECRET` is exposed anywhere in the environment, an attacker can request any artifact key the service will accept, across all teams handled by that worker.

Evidence:

- `apps/worker/src/artifact-server.ts:7-15` authenticates requests with a single static secret.
- `apps/worker/src/artifact-server.ts:44-80` authorizes artifact downloads solely through that bearer token.
- `apps/worker/src/main.ts:13-18` starts the HTTP artifact server whenever that secret is present.

Why this is insecure:

- Authorization is not tied to the requesting user, session, team, or report.
- The blast radius is the entire worker, not a single artifact or tenant.

Improvement plan:

- Replace the shared secret with short-lived, scoped download tokens or signed URLs.
- Bind artifact authorization to the report/team being requested.
- Keep the worker port internal-only and restrict callers at the network layer.

### SEC-09 Low: Admin access is hard-coded to a single email address

Impact: Privilege management is brittle, code-bound, and dependent on one mailbox identity.

Evidence:

- `apps/web/src/app/(app)/admin/layout.tsx:5-15` gates admin UI with a hard-coded `ADMIN_EMAIL`.
- `apps/web/src/app/api/admin/users/route.ts:8-15` does the same for API access.
- `apps/web/src/app/api/admin/ai-report-settings/route.ts:10-17` repeats the pattern in another admin surface.

Why this is insecure:

- Admin privileges are not modeled in the database or an authorization system.
- A mailbox transfer, alias confusion, or identity lifecycle event becomes a privilege-management problem.

Improvement plan:

- Move admin authorization to a durable role/permission model stored server-side.
- Audit all admin endpoints against a shared `requireAdmin()` or RBAC policy.

## Items To Verify Outside The Repo

These are important, but the current repository view does not prove them either way:

- CSRF protection for cookie-authenticated `POST`/`PATCH`/`DELETE` routes. `packages/shared/src/lib/auth.ts:30-34` sets `trustedOrigins`, but I did not find route-level Origin/Referer enforcement in app code.
- Better Auth session cookie flags (`HttpOnly`, `Secure`, `SameSite`) at runtime.
- Whether session tokens are hashed before storage or stored as bearer secrets in `session.token` (`packages/shared/src/db/schema.ts:26-37`).
- Whether the worker has outbound egress controls blocking RFC1918, loopback, link-local, and cloud metadata addresses.
- Whether artifact storage, database backups, and centralized logs are encrypted and access-controlled.
- Whether production edge/CDN sets CSP and other security headers even though they are not visible in app code.

## Prioritized Remediation Plan

### Phase 1: Immediate

- Fix `affectedUrls` rendering so only safe HTTP(S) URLs become links.
- Add SSRF guards to crawl entrypoints and block internal/private destinations.
- Stop returning raw exception messages to clients.
- Enforce `isRestricted` server-side on cost-bearing and write endpoints.

### Phase 2: Short Term

- Encrypt Google OAuth tokens at rest and tighten access to token-bearing tables.
- Add quotas/rate limits for report creation, property sync, and detail generation.
- Replace hard-coded admin email checks with RBAC.
- Replace the worker-wide artifact bearer secret with scoped download authorization.

### Phase 3: Hardening

- Add or document baseline security headers and verify them in production.
- Redact worker/app logs consistently.
- Review session-token storage semantics and hash/sign where appropriate.
- Add security regression tests for SSRF blocking, safe-link rendering, restricted-user enforcement, and authorization boundaries.

## Notes

- No code changes were made as part of this review.
- I did not find tracked `.env*` files in the git index during this pass, which is the correct baseline; keep it that way and rotate any secrets that may have existed historically.
