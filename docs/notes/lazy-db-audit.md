# Lazy DB Init Audit

## Problem

`packages/shared/src/db/index.ts` calls `getQueryClient()` at module top:

```ts
export const queryClient = getQueryClient();           // <-- eager, runs requireRuntimeDatabaseUrl()
export const db = drizzle(queryClient, { schema });
```

Any file that imports `{ db }` from `@webhealth/shared/db` will crash at import time when `DATABASE_URL` is unset. This blocks unit tests that only exercise pure logic but live in modules that also contain DB code (e.g. `property-refresh.ts`, `active-property-automation.ts`). The current workaround is to extract pure logic into sibling `-policy.ts` files.

## Files in `packages/shared/src/lib/` importing `@webhealth/shared/db` (the `db` value)

- feature-flags.ts
- active-property-automation.ts
- ai-runtime-settings.ts
- admin-access.ts
- metrics-cache.ts
- team-branding.ts
- tier-change-cleanup.ts
- sync-properties.ts
- ai-analysis-runner.ts
- property-refresh.ts
- ai-run-center.ts
- property-refresh-worker.ts
- ai-dashboard-actions.ts
- live-dashboard.ts
- product-event-store.ts
- auth.ts
- properties/reportable-properties-db.ts

All use `db.<method>(...)` style — property access on a stable object, then method calls. Drizzle's `db` is the result of `drizzle(queryClient, { schema })` — a plain object with prototype methods and a `query` namespace object.

## Chosen pattern: (a) Lazy Proxy

Replace the eager `db` constant with a `Proxy` that defers `drizzle(...)` instantiation (and therefore `requireRuntimeDatabaseUrl()`) until first property access. The Proxy's `get` trap is the only trap needed: every Drizzle API call begins with a property read (`db.select`, `db.query`, `db.insert`, `db.execute`, `db.update`, `db.transaction`).

### Why (a) over (b) and (c)

- (b) getter would require touching 17+ callers — high blast radius, churn in production code paths.
- (c) Drizzle's `drizzle()` factory needs the query client at construction. Deferring inside drizzle internals is out of scope.
- (a) keeps `import { db } from "@webhealth/shared/db"` working with zero caller changes.

### Compatibility check

Drizzle accesses on `db` observed in this codebase:
- `db.select(...)`, `db.insert(...)`, `db.update(...)`, `db.delete(...)`
- `db.query.tableName.findFirst/findMany`
- `db.execute(sql\`...\`)`
- `db.transaction(...)` (if used)

A Proxy returning `Reflect.get(target, prop, receiver)` after lazy-resolving `target` works for all of these. Method `this` binding is preserved because methods are invoked as `db.method(...)` (Proxy forwards `get`, then JS invokes the returned function with `db` as receiver — receiver is the Proxy, which forwards back to the real object via `get`).

## Expected blast radius

- 1 file edited: `packages/shared/src/db/index.ts`.
- 0 caller files edited (no API change).
- Tests that import `property-refresh.ts` / `active-property-automation.ts` without `DATABASE_URL` should succeed because the Proxy doesn't trigger init until a property is accessed — and the test code paths don't touch `db`.

## Follow-on (out of scope for this task)

Any other `-policy.ts` files extracted purely as DB-import workarounds become candidates for inlining once this lands.
