# Backend

## General rules

- Keep route handlers thin. They should authenticate, validate inputs, call logic, and shape the response.
- Extract reusable or non-trivial route behavior into colocated `route.logic.ts` or other nearby helper files.
- Move shared behavior into `packages/shared` when both web and worker may need it or when it represents domain logic rather than transport logic.

## Data and auth

- Use Drizzle and the existing schema modules under `packages/shared/src/db`.
- Reuse auth helpers and server utilities from `@webhealth/shared/lib/*` rather than duplicating request or permission logic.
- Respect the current database split described in README: pooled runtime connection for app traffic and direct connection for migrations and bootstrap flows.

## Worker and report pipeline

- The worker owns long-running report processing.
- Web routes should enqueue, retry, or read status; they should not execute the full report pipeline inline.
- Keep deterministic report shaping, OpenAI orchestration, and snapshot/cache logic in shared modules where the worker and web can consume the same contracts.

## File patterns already in use

- Shared report and integration logic lives under `packages/shared/src/lib`.
- Queue helpers live under `packages/shared/src/queue` or `packages/shared/src/lib/queue`.
- Route-specific logic tests are commonly colocated beside `route.logic.ts`.

## Naming and exports

- Prefer descriptive file names over vague helper names.
- Use barrel exports in `packages/shared` only where the package already exposes a stable entry point.
- Match existing import style and avoid introducing a second path to the same helper.
