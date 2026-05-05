# Responsive UI Assessment

## Summary
The homepage is generally polished on desktop and tablet portrait, but the responsive behavior has several concrete breakpoints that need attention before the page can be considered production-stable. The highest-impact issues are on mobile: the sticky header creates page-level horizontal overflow and clips the authenticated actions, and the comparison table is visibly cut off because the table is wider than its card. The mid-size layout also has a 1024px hero breakpoint where the headline becomes awkwardly narrow, and the pricing cards stretch into uneven card proportions at tablet and desktop widths.

## Viewports Tested
- 1440x900 desktop
- 1280x800 laptop
- 1024x768 tablet landscape
- 768x1024 tablet portrait
- 430x932 mobile
- 390x844 mobile
- 360x800 small mobile

## Findings

### 1. Mobile header overflows and clips authenticated actions
- **Viewport(s):** 430x932, 390x844, 360x800
- **Section:** Header/navigation
- **Observed behavior:** The sticky header tries to keep the logo, language toggle, `Dashboard`, and `Sign out` controls on one row. On 430px, 390px, and 360px widths the right-side action group extends beyond the viewport. In the rendered page the `Sign out` button reaches past the right edge, and page-level horizontal overflow appears. Measured document widths were 439px at 430px, 390px, and 360px viewport widths.
- **Expected behavior:** Header actions should stay fully visible without causing horizontal page scroll. On small mobile, the authenticated actions should either collapse into a compact menu, move to a second row, hide lower-priority text behind icons, or use a mobile-specific layout.
- **Likely cause in code:** `apps/web/src/app/(marketing)/agency-homepage-client.tsx` keeps the header as a single `justify-between` flex row at lines 219-301. The right action container at lines 251-290 has no mobile wrapping or menu fallback, and the authenticated `Dashboard`/`Sign out` buttons use normal button widths.
- **Suggested fix:** Add a mobile authenticated-actions treatment below `sm` or below a custom breakpoint. Options include replacing the two action buttons with one account/menu button, hiding the brand suffix, reducing language toggle padding, or allowing the header content to wrap into two rows with a controlled height.
- **Needs user decision:** Yes
- **Question for implementation:** On authenticated mobile, should `Dashboard` and `Sign out` remain visible as separate buttons, collapse into an account menu, or should `Sign out` be moved out of the top bar?

### 2. Comparison table is cut off on mobile despite an overflow wrapper
- **Viewport(s):** 430x932, 390x844, 360x800
- **Section:** "The honest math on monthly reporting."
- **Observed behavior:** The comparison table is wider than its rounded card on mobile. The rightmost `With Webhealth` column is clipped at the viewport edge, so users see partial text and no clear affordance that the table can be horizontally scrolled. Measurements showed the table remains about 452px wide while the visible wrapper is 388px at 430px, 348px at 390px, and 318px at 360px.
- **Expected behavior:** All comparison content should be readable at mobile sizes. If horizontal scrolling is intentional, the card needs clear scrolling behavior and a visible cue; otherwise the table should transform into stacked comparison cards or rows.
- **Likely cause in code:** In `apps/web/src/app/(marketing)/agency-homepage-client.tsx`, the table wrapper uses `overflow-x-auto` at lines 1246-1248, but the outer rounded container uses `overflow-hidden` at line 1246. The table cells also keep desktop padding (`px-6 py-5`) and a three-column table structure at lines 1251-1290, producing a minimum visual width larger than the mobile card.
- **Suggested fix:** Prefer a mobile-specific stacked layout for the comparison rows below `sm`, with each row showing the label, manual state, and Webhealth state vertically. If keeping the table, remove the conflicting clipping, add an explicit `min-w-*` table width, and include a visible scroll affordance/fade.
- **Needs user decision:** Yes
- **Question for implementation:** Should this comparison become stacked mobile cards, or should it remain a horizontally scrollable table with a visible scroll cue?

### 3. Pricing cards stretch into inconsistent rectangles
- **Viewport(s):** 1440x900, 1280x800, 1024x768, 768x1024, 360x800
- **Section:** Plans/pricing section
- **Observed behavior:** At 1440x900 and 1280x800, all four pricing cards are forced to the same 575px height even though the first two plans have much less content, leaving large empty blocks before their CTA buttons. At 1024x768 and 768x1024, the grid becomes two columns: the first row cards are 365px tall while the second row cards are 532px tall, making the pricing area feel inconsistent. At 360x800, the `Studio` and `Agency` cards become taller than the preceding cards and the proportions change again.
- **Expected behavior:** Pricing cards should maintain a consistent and intentional hierarchy across breakpoints. The CTA alignment can be consistent, but the cards should not create large unused empty rectangles or vary dramatically unless the design intentionally prioritizes equal-height rows.
- **Likely cause in code:** `apps/web/src/app/(marketing)/agency-homepage-client.tsx` uses `grid items-stretch` at line 1316 and each card uses `flex h-full ... self-stretch` at lines 1318-1324, with CTAs pushed down using `mt-auto` at lines 1420, 1426, and 1432. This forces equal heights within each grid row and exaggerates the height difference created by the content-heavy Agency plan.
- **Suggested fix:** Revisit the card-height strategy. Possible approaches: remove `h-full/self-stretch` except at `xl`, use `items-start`, give cards natural height on mobile/tablet, or split the Agency slider into a compact pricing control so equal-height rows do not produce large empty areas.
- **Needs user decision:** Yes
- **Question for implementation:** Should pricing cards preserve equal-height CTA alignment, or should each card use natural height at mobile/tablet and only align CTAs on wide desktop?

### 4. Hero headline becomes awkwardly narrow at tablet landscape
- **Viewport(s):** 1024x768
- **Section:** Hero
- **Observed behavior:** At 1024px wide, the layout switches to the desktop two-column hero and the headline uses the large desktop scale. The left column becomes narrow enough that `Stop rebuilding the same monthly report.` breaks into four large lines, while the preview card occupies the right column. The result feels more cramped than either the wider desktop layout or the stacked tablet portrait layout.
- **Expected behavior:** The hero should either remain stacked until there is enough width for the two-column composition, or the headline size/column ratio should step down at 1024px so the line breaks remain intentional.
- **Likely cause in code:** `apps/web/src/app/(marketing)/agency-homepage-client.tsx` switches the hero grid at `lg:grid-cols-[1.02fr_1fr]` on line 315 and applies `lg:text-7xl` to the headline at line 322. Tailwind's `lg` breakpoint starts at 1024px, which is too early for this specific composition.
- **Suggested fix:** Delay the two-column hero layout to `xl`, reduce the headline scale at `lg`, or adjust the grid ratio so the copy column has more room at 1024px.
- **Needs user decision:** No
- **Question for implementation:** None

### 5. Integration graphic consumes excessive mobile vertical space
- **Viewport(s):** 430x932, 390x844, 360x800
- **Section:** Integrations
- **Observed behavior:** After the integration cards stack on mobile, the floating icon graphic still reserves a large vertical area. The graphic occupies roughly another full mobile screen, with sparse content and large blank space around the icons. It does not overlap, but it weakens the visual hierarchy and makes the section feel much longer than its content warrants.
- **Expected behavior:** Mobile should either compress the graphic, place it beside/inside the integration list in a smaller treatment, or hide it if the cards already communicate the integrations.
- **Likely cause in code:** `apps/web/src/app/(marketing)/agency-homepage-client.tsx` sets the graphic container to `relative min-h-[500px] overflow-hidden` at line 1210, with absolutely positioned icons at lines 1211-1226. That fixed minimum height applies on mobile too.
- **Suggested fix:** Add mobile-specific sizing such as `min-h-[260px] sm:min-h-[360px] lg:min-h-[500px]`, reduce icon sizes at small widths, or hide the decorative graphic below `sm` if the section should stay compact.
- **Needs user decision:** Yes
- **Question for implementation:** Should the mobile integrations graphic be compacted into a smaller visual, or hidden below the stacked integration cards?

### 6. White-label report mockups stay readable but the overlap needs an explicit mobile decision
- **Viewport(s):** 430x932, 390x844, 360x800
- **Section:** White-label reports
- **Observed behavior:** The two report mockups stack before the explanatory copy on mobile. The second card uses a negative top margin and left offset, so it overlaps the first card. It is readable at the tested sizes, but at 360px the overlap and padding make the mockup feel dense and the first card appears partially subordinated rather than clearly paired with the client deliverable.
- **Expected behavior:** If the overlap is intentional, it should be tuned for mobile so both cards feel deliberately layered. If the goal is clarity, the cards should stack with less overlap or no overlap at the smallest widths.
- **Likely cause in code:** `apps/web/src/app/(marketing)/agency-homepage-client.tsx` uses `relative -mt-10 ml-8 ... p-8 sm:ml-14 lg:ml-10` for the second mockup at line 1056, while both mockups keep large `p-8` padding and three-column KPI rows at lines 1022 and 1097.
- **Suggested fix:** Add smaller mobile padding, reduce or remove the negative margin/left offset below `sm`, or switch the mockups to a simpler stacked mobile treatment.
- **Needs user decision:** Yes
- **Question for implementation:** On mobile, should the two white-label report cards remain visually overlapped, or should they stack as separate cards for readability?
