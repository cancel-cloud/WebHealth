# Frontend

## Stack and file structure

- `apps/web` uses Next.js App Router with route groups such as `(app)`, `(marketing)`, and `(settings)`.
- Default to server components. Add `"use client"` only when state, effects, event-heavy interactions, or browser APIs require it.
- Keep app-specific components near the route that uses them; keep reusable primitives under `apps/web/src/components/ui`.

## Styling

- Use Tailwind CSS v4 utilities and the CSS variables defined in `apps/web/src/app/globals.css`.
- Prefer semantic tokens like `bg-background`, `text-foreground`, `border-border`, and `text-muted-foreground` before hard-coded colors.
- Match the existing design system: shadcn `new-york` style, neutral token base, rounded surfaces, soft shadows, and existing typography tokens.
- Use `8px` as the standard corner radius for non-circular UI across the site. Prefer `rounded-lg` and the shared `--radius: 0.5rem` token instead of mixing `rounded-md`, `rounded-xl`, or ad hoc pixel radii.
- Pricing badge rule: keep markup local to the page, but reuse the same badge palette across pricing surfaces. `Most Popular` must use the existing brand primary token with `bg-primary text-primary-foreground`, not an ad hoc blue. `Coming Soon` uses a light-blue fill with darker blue text.
- The repo already uses Inter for body copy and Outfit for display text. Keep that split when adding major headings or dashboard cards.
- Treat light mode as the brand anchor. Dark mode should be derived from dedicated semantic tokens, not by improvising one-off dark overrides.

## Components and imports

- Reuse shadcn components from `@/components/ui/*` before creating new primitives.
- Use the shared `cn()` helper from `@webhealth/shared/lib/utils` for conditional class merging.
- Respect the existing path aliases from `apps/web/components.json`.

## Composition patterns

- Keep pages and layouts focused on data loading, composition, and top-level markup.
- Move non-trivial event, derivation, or transformation logic into a nearby `*.logic.ts` module when it improves clarity or testability.
- Preserve the current separation between marketing UI, dashboard UI, and admin UI instead of introducing a one-size-fits-all layout pattern.
- Authenticated screens should use the shared app shell with:
  - fixed desktop sidebar
  - mobile drawer navigation
  - framed content canvas
  - one shared centered content-width constraint inside the canvas, so pages do not expand to raw full-card width on large desktops
  - consistent header spacing and rounded surfaces
- Settings belongs to the authenticated shell. Do not reintroduce a bespoke settings top bar or left profile rail.
- Sidebar rules:
  - preserve the current WebHealth nav items and icons
  - keep the sidebar surface aligned with the shared shell background instead of introducing a competing panel color
  - on desktop, treat the sidebar and the gap before the content canvas as one continuous shell-colored field; the content canvas creates the contrast, not a separate rail-divider fill
  - do not use content-card shadows that bleed into the shell gap next to the sidebar; that area should read as plain shell background
  - make hovered nav rows and the selected row visibly darker than the resting state by using a meaningfully darker `sidebar-accent` token; do not rely on low-opacity overlays or stack an extra darken layer when the selected row is hovered
  - keep usage and a full-width account menu in the footer; place theme switching inside the account menu as one vertical segmented control aligned to the footer width instead of using a separate footer button
  - keep support links grouped together in a dedicated support section
- When refining existing UI primitives or authenticated app screens, normalize corners back to the `8px` system rather than introducing larger panel radii.
- Settings-page rules:
  - keep the `Account` and `Contact Us` tabs
  - place account summary and usage above pricing
  - remove shortcut-help chrome from settings unless the user explicitly asks for it back

## UX tone

- Prefer clear, product-oriented copy over filler text.
- Match existing emphasis patterns: concise headings, short support text, and restrained motion via Framer Motion where it already exists.
