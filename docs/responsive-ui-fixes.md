# Responsive UI Fixes

## Summary
Fixed the responsive homepage issues from `docs/responsive-ui-assessment.md` with targeted layout and Tailwind breakpoint changes. The updates remove mobile horizontal overflow, make mobile comparison content readable without horizontal scrolling, keep pricing cards natural-height through the tested desktop/tablet/mobile sizes, delay the cramped hero split layout, compact the integrations graphic on mobile, and tune the mobile white-label report overlap.

## Fixed Issues

### Mobile header overflows and clips authenticated actions
- Original problem: The authenticated header kept the logo, language toggle, `Dashboard`, and `Sign out` controls in one row on small mobile, causing clipping and horizontal overflow.
- Files changed: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`
- Fix implemented: Added a mobile-only account dropdown below `sm` for authenticated users, while keeping the separate `Dashboard` and `Sign out` buttons at `sm+`. Also tightened mobile header spacing, hid the brand suffix below `sm`, shortened the unauthenticated mobile sign-in label, and preserved the full sign-in text as the accessible label.
- Viewports verified: 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, 360x800. Authenticated mobile was verified with a mocked `get-session` response at 430x932, 390x844, and 360x800.

### Comparison table is cut off on mobile despite an overflow wrapper
- Original problem: The three-column table was wider than the mobile card and clipped the `With Webhealth` column.
- Files changed: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`
- Fix implemented: Added stacked comparison cards below `sm`, with each card showing the row label, manual state, and Webhealth state vertically. The existing table remains for `sm+`.
- Viewports verified: 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, 360x800.

### Pricing cards stretch into inconsistent rectangles
- Original problem: Pricing cards were forced to equal heights too early, leaving large empty areas in shorter plans and uneven proportions across breakpoints.
- Files changed: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`
- Fix implemented: Removed forced stretch behavior through the tested sizes. Pricing cards now use natural height on mobile, tablet, laptop, and standard desktop widths; equal-height CTA alignment is limited to `2xl+`.
- Viewports verified: 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, 360x800.

### Hero headline becomes awkwardly narrow at tablet landscape
- Original problem: At 1024px, the hero switched to the two-column layout too early and forced the headline into cramped line breaks.
- Files changed: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`
- Fix implemented: Delayed the two-column hero composition from `lg` to `xl` and kept the headline scale steadier at `lg`.
- Viewports verified: 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, 360x800.

### Integration graphic consumes excessive mobile vertical space
- Original problem: The decorative integrations graphic kept its 500px minimum height on mobile, making the section much longer than its content warranted.
- Files changed: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`
- Fix implemented: Compacted the graphic on mobile with a smaller minimum height, smaller central mark, smaller icon tiles, and adjusted positions. The full-size treatment remains at `lg+`.
- Viewports verified: 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, 360x800.

### White-label report mockups stay readable but the overlap needs an explicit mobile decision
- Original problem: The mobile overlap was readable but dense, with large padding and offsets making the pair feel cramped at 360px.
- Files changed: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`
- Fix implemented: Kept the visual overlap as requested, but reduced mobile padding, KPI gaps, KPI text scale, negative margin, and left offset below `sm`.
- Viewports verified: 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, 360x800.

## Remaining Questions / Deferred Items
None. The requested ambiguous decisions were resolved before implementation.
