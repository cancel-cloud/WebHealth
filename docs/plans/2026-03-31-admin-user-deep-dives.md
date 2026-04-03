# Admin User Deep Dives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Deep dives usage and plan-limit visibility to the admin user management slideover.

**Architecture:** Keep the existing `/api/admin/users` endpoint as the single source for admin user detail data. Add a small route logic mapper for enriching admin users with report counts, Deep dives monthly usage, sign-in metadata, and plan limits so the behavior is testable without heavy route setup.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, `node:test`, ESLint

---

### Task 1: Add a failing Deep dives mapping test

**Files:**
- Create: `apps/web/src/app/api/admin/users/route.logic.ts`
- Create: `apps/web/src/app/api/admin/users/route.logic.test.ts`

**Step 1: Write the failing test**

Add a test that passes one raw admin user row plus lookup maps and asserts the result includes:
- `deepDivesThisMonth`
- `reportsCount`
- `reportsLast30Days`
- `lastSignedInAt`
- `planLimits`

**Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test apps/web/src/app/api/admin/users/route.logic.test.ts`

Expected: FAIL because the mapper does not exist yet.

**Step 3: Write minimal implementation**

Create `route.logic.ts` with a pure mapper that enriches raw admin user rows using precomputed maps.

**Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test apps/web/src/app/api/admin/users/route.logic.test.ts`

Expected: PASS.

### Task 2: Wire the admin users route and slideover

**Files:**
- Modify: `apps/web/src/app/api/admin/users/route.ts`
- Modify: `apps/web/src/app/(app)/admin/users/users-table.tsx`
- Modify: `apps/web/src/app/(app)/admin/users/user-detail-sheet.tsx`

**Step 1: Add Deep dives usage to the admin route**

Load the current month `team_usage.details_count` rows, build a lookup map, and pass it into the mapper.

**Step 2: Extend the admin user type**

Add `deepDivesThisMonth` to the `AdminUser` shape used by the table and slideover.

**Step 3: Render the new UI rows**

Show `Deep dives (this month)` in Stats and `Deep dives / month` in Plan Limits.

**Step 4: Verify UI code stays minimal**

Do not add new client-side fetching or duplicate formatting helpers.

### Task 3: Verify the change

**Files:**
- Test: `apps/web/src/app/api/admin/users/route.logic.test.ts`
- Lint: `apps/web/src/app/api/admin/users/route.ts`
- Lint: `apps/web/src/app/api/admin/users/route.logic.ts`
- Lint: `apps/web/src/app/(app)/admin/users/users-table.tsx`
- Lint: `apps/web/src/app/(app)/admin/users/user-detail-sheet.tsx`

**Step 1: Run the targeted test**

Run: `pnpm exec tsx --test apps/web/src/app/api/admin/users/route.logic.test.ts`

**Step 2: Run focused lint**

Run: `pnpm --filter @webhealth/web exec eslint src/app/api/admin/users/route.ts src/app/api/admin/users/route.logic.ts src/app/'(app)'/admin/users/users-table.tsx src/app/'(app)'/admin/users/user-detail-sheet.tsx`

**Step 3: Confirm outcome**

Deep dives usage and limits should now be visible in the slideover with no unrelated admin table changes.
