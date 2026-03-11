# Pricing Badge Design

**Date:** 2026-03-09

## Goal

Standardize the pricing badges used on the settings plan cards and the marketing landing-page pricing section without introducing a shared badge component.

## Decisions

- Keep badge markup local in each page.
- Standardize the badge class recipes and color usage across both pricing surfaces.
- Keep `Most Popular` above the Pro card.
- Keep `Coming Soon` inline beside the Agency plan name.
- Use the following badge colors consistently:
  - `Most Popular`: blue background with black text
  - `Coming Soon`: light blue background with darker blue text
- Add the badge styling rule to the frontend style guide so future pricing surfaces reuse the same visual language.

## Scope

- `apps/web/src/app/(settings)/settings/page.tsx`
- `apps/web/src/components/pricing-section.tsx`
- `apps/web/src/app/(settings)/settings/settings-page.logic.ts`
- `apps/web/src/app/(settings)/settings/settings-page.logic.test.ts`
- `.agents/skills/styleguide/references/frontend.md`

## Verification

- Focused test for the pricing badge class contract
- Focused `eslint` on touched files
