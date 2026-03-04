# WebHealth — Project Notes for Claude

## Dev URL
**Always use `https://webaudit-79.localcan.dev` — never `http://localhost:3000`.**

`BETTER_AUTH_URL` is set to the localcan tunnel. Better Auth scopes OAuth state cookies to the request origin, so starting sign-in at a different origin than the callback URL causes a `state_security_mismatch`. Consistently using the tunnel URL keeps the cookie domain aligned across the full OAuth roundtrip.

If the localcan URL changes, update `BETTER_AUTH_URL` in `.env.local` to match.

## Conventions
- Shared types: `packages/shared/src/types/`
- Zod schemas for OpenAI: `packages/shared/src/schemas/`
- Drizzle schema: `packages/shared/src/db/schema.ts`
- Barrel exports (index.ts) in packages/shared
- Server components default in Next.js; 'use client' only when needed
- Always run `pnpm typecheck` after cross-package changes
## Report Pipeline
Worker: fetch GSC/GA4 → compute deterministic insights → OpenAI structured output → store to DB
Web: read from DB → render typed report sections as React components