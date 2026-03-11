# Architecture

## Repository shape

- `apps/web`: Next.js product UI, auth, short request-response APIs, queue enqueueing, and report reads
- `apps/worker`: long-running report processing and background jobs
- `packages/shared`: shared database access, queue helpers, report logic, OpenAI helpers, and common utilities
- `drizzle`: SQL migrations and database schema changes

## Service boundaries

- `apps/web` must not perform long background report execution inside HTTP handlers.
- `apps/worker` owns report execution, retries, and background processing.
- `packages/shared` is the default home for logic that is reused across services or is easier to test outside UI files.

## Placement rules

- Put UI-only code in `apps/web/src/components` or the nearest route segment under `apps/web/src/app`.
- Put shared authenticated shell code in reusable components rather than duplicating page-level top bars or side rails.
- Put route-specific behavior in a nearby `*.logic.ts` file when the route or page would otherwise become dense or difficult to test.
- Put reusable domain logic in `packages/shared/src/lib` or `packages/shared/src/queue`.
- Keep database schema and connection concerns under `packages/shared/src/db`.

## Cross-package changes

- Treat `packages/shared` as the contract layer between web and worker.
- After changing shared exports, check whether consumers in both `apps/web` and `apps/worker` need updates.
- Verify cross-package changes with the real commands available in the packages you touched, such as targeted tests, `pnpm --filter @webhealth/web lint`, or a production build for `apps/web` when the change affects runtime wiring.

## Existing project constraints

- The platform is queue-first. New features should fit that model instead of bypassing it.
- Authenticated surfaces should converge on one shell even when routes live in different route groups.
- README runbooks are part of the source of truth for deployment and database behavior when structural changes are involved.
