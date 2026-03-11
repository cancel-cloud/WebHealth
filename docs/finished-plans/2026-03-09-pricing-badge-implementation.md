# Pricing Badge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make pricing badges visually consistent between settings and the landing page while documenting the approved badge palette in the frontend style guide.

**Architecture:** Keep JSX markup local to each page and move only the reusable class contract into the existing settings logic file. Update the two pricing surfaces to consume the same badge classes and mirror the same badge placement rules.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, Node `node:test`

---

### Task 1: Badge class contract

**Files:**
- Modify: `apps/web/src/app/(settings)/settings/settings-page.logic.ts`
- Modify: `apps/web/src/app/(settings)/settings/settings-page.logic.test.ts`

**Step 1: Write the failing test**

Add a test that expects the pricing badge classes to expose:
- a shared base badge shape
- a `Most Popular` variant with blue background and black text
- a `Coming Soon` variant with light-blue background and darker-blue text

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @webhealth/web exec tsx --test 'src/app/(settings)/settings/settings-page.logic.test.ts'`

Expected: FAIL because the badge class helper does not exist yet.

**Step 3: Write minimal implementation**

Add a helper in `settings-page.logic.ts` that returns the badge class strings.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @webhealth/web exec tsx --test 'src/app/(settings)/settings/settings-page.logic.test.ts'`

Expected: PASS

### Task 2: Apply badge styling

**Files:**
- Modify: `apps/web/src/app/(settings)/settings/page.tsx`
- Modify: `apps/web/src/components/pricing-section.tsx`

**Step 1: Update settings pricing badges**

Apply the badge helper classes to the Pro `Most Popular` badge and the Agency `Coming Soon` badge while preserving their local markup placement.

**Step 2: Update landing-page pricing badges**

Replace the inline badge colors with the approved class recipes while keeping the existing local markup structure.

**Step 3: Verify visual intent in code**

Confirm both pages use the same palette and casing for the badge labels.

### Task 3: Document styling rule

**Files:**
- Modify: `.agents/skills/styleguide/references/frontend.md`

**Step 1: Add the pricing badge guideline**

Document that pricing badges should use:
- `Most Popular`: blue fill with black text
- `Coming Soon`: light-blue fill with darker-blue text

**Step 2: Run focused verification**

Run:
- `pnpm --filter @webhealth/web exec tsx --test 'src/app/(settings)/settings/settings-page.logic.test.ts'`
- `pnpm --filter @webhealth/web exec eslint 'src/app/(settings)/settings/page.tsx' 'src/components/pricing-section.tsx' 'src/app/(settings)/settings/settings-page.logic.ts' 'src/app/(settings)/settings/settings-page.logic.test.ts'`

Expected: PASS with no lint errors.
