# Lazy DB Proxy in `@webhealth/shared/db`

The `db` export from `packages/shared/src/db/index.ts` is a `Proxy` that constructs the real Drizzle client (and calls `requireRuntimeDatabaseUrl()`) on first property access, not at module load. This is deliberate: it lets every consumer in `packages/shared/src/lib/` be imported by unit tests without `DATABASE_URL` set. Before this change, the codebase worked around the eager-init by carving pure logic out into `-policy.ts` sibling files purely so tests could import the pure half — a real seam, but a defensive one. The Proxy fixes the root cause and made those siblings unnecessary (see the inlines in commit `268394d`).

Do not "simplify" the Proxy back to a plain `export const db = drizzle(...)`. Doing so will re-break unit-test imports across `packages/shared/src/lib/` and resurrect pressure to re-extract `-policy.ts` workarounds.
