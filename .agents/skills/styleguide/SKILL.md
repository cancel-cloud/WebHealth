---
name: styleguide
description: Use when working inside the WebHealth repository and you need project-specific architecture, frontend, backend, or testing conventions before making changes.
---

# WebHealth Styleguide

## Overview

This skill captures the conventions already used in the WebHealth codebase. Use it to match the repository's current structure before adding new files, moving logic, or changing UI behavior.

## Start Here

1. Read `CLAUDE.md` for local environment notes that affect development flow.
   Do not use it as the source of truth for repository structure or file locations.
2. Read the reference file that matches the area you are touching:
   - `references/architecture.md` for file placement, service boundaries, and cross-package changes
   - `references/frontend.md` for `apps/web`, React, Next.js, Tailwind, and UI composition
   - `references/backend.md` for route handlers, worker code, shared logic, and data access
   - `references/testing.md` for test placement and test style
3. Match existing naming, file placement, and import patterns before inventing a new abstraction.

## Always Follow

- Preserve the queue-first architecture: `apps/web` renders UI and enqueues work, `apps/worker` runs long-lived jobs, and `packages/shared` holds shared domain logic.
- Preserve the authenticated app shell standard: dashboard, reports, properties, settings, admin, and authenticated detail routes should use the shared WebHealth shell instead of bespoke page chrome.
- Keep non-trivial business logic out of page components and route handlers. Extract it into `packages/shared` or colocated `*.logic.ts` files.
- Keep tests close to the behavior they cover using colocated `*.test.ts` files.
- Reuse existing utilities and aliases such as `@/components`, `@/hooks`, `@webhealth/shared/lib/*`, and the shared `cn()` helper before adding parallel helpers.
- Prefer the existing design language over generic replacements: Tailwind v4 utilities, shadcn UI primitives, CSS variables from `src/app/globals.css`, the current typography mix of Inter plus Outfit, and the Catalyst-inspired fixed sidebar shell used by authenticated surfaces.
- Use `8px` as the default corner radius across the web app. In practice that means `--radius: 0.5rem` and `rounded-lg` for normal surfaces and controls; reserve `rounded-full` for pills, avatars, and status dots.
- For routine frontend verification, default to `pnpm dev` plus focused `eslint` on touched files and targeted tests for the changed logic. Do not default to a full web build for every small UI tweak.

## Decision Rules

- Touching multiple packages or moving responsibilities between services:
  read `references/architecture.md` first.
- Changing a page, layout, component, or styles in `apps/web`:
  read `references/frontend.md`.
- Editing API routes, worker jobs, auth, database access, or shared report logic:
  read `references/backend.md`.
- Fixing a bug or changing behavior:
  read `references/testing.md` before implementation.
- Run `pnpm --filter @webhealth/web build` only when the user explicitly asks for it or when the change is structurally significant, such as route/layout rewrites, import boundary changes, or server/client rendering changes.

## Avoid

- Running long report generation inside web request handlers
- Adding `"use client"` to files that can stay server-rendered
- Hiding business rules inside JSX-heavy components
- Creating duplicate helpers when a shared utility or established file pattern already exists
- Introducing repo-wide patterns that conflict with current Next.js, Drizzle, Tailwind, or shadcn usage
