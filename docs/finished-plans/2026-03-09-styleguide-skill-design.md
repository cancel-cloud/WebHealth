# WebHealth Styleguide Skill Design

## Goal

Create a project-local skill that captures WebHealth's current architecture, coding, UI, and testing conventions so future agent work in this repository starts from the repo's actual patterns instead of generic defaults.

## Scope

- Add a repo-local skill at `.agents/skills/styleguide/`
- Keep `SKILL.md` short and procedural
- Move detailed conventions into focused reference files
- Expose the skill through a project `AGENTS.md` entry so it is discoverable in this repository

## Chosen approach

Use one local `styleguide` skill with a lean `SKILL.md` plus four reference files:

- `architecture.md`
- `frontend.md`
- `backend.md`
- `testing.md`

This keeps the trigger simple while avoiding a large monolithic skill file that would become hard to maintain.

## Source material

- `README.md` for architecture, service boundaries, and runbooks
- `CLAUDE.md` for local development notes and existing conventions
- `apps/web/eslint.config.mjs`, `apps/web/components.json`, and `apps/web/src/app/globals.css` for frontend patterns
- Representative page, route, and test files in `apps/web` and `packages/shared`

## Success criteria

- Future agent work in this repository can discover the project-specific skill
- The skill points agents to the right convention file for the area they are editing
- The references reflect current repository patterns without inventing a second design system
