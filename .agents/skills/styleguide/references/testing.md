# Testing

## Existing test style

- The repository uses colocated `*.test.ts` files.
- Current tests use Node's built-in `node:test` module and `node:assert/strict`.
- Test pure logic modules directly whenever possible instead of testing through a heavy page or route wrapper.

## Practical rules

- If a route or component change adds non-trivial logic, extract that logic into a testable module first.
- Prefer narrow tests with explicit fixtures over broad integration-style setup when unit behavior is what changed.
- Keep test names specific about the behavior being protected.
- Preserve adjacent tests when editing a feature area; extend them rather than creating a disconnected test style.

## Common patterns in this repo

- `route.logic.ts` pairs with `route.logic.test.ts`
- Page-specific helper logic can live in `*.logic.ts` next to the page and be tested beside it
- Shared library behavior in `packages/shared/src/lib` is typically tested in a neighboring file

## Verification expectations

- Run the smallest relevant test first when changing behavior.
- Run broader verification when shared code or cross-package contracts change.
- For cross-package changes, use the verification commands that actually exist in the touched package. This repo currently relies on targeted `node --test` runs and package-specific checks rather than a shared `pnpm typecheck` command.
