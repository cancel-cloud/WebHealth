# WebHealth Agent Notes

## Available project skills
- styleguide: Use when working inside this repository and you need project-specific architecture, frontend, backend, or testing conventions before making changes. (file: `./.agents/skills/styleguide/SKILL.md`)

## Project notes
- Prefer the local `styleguide` skill for any code, review, or refactor task in this repo.
- Keep `CLAUDE.md` as supplemental context for environment-specific notes such as the local auth tunnel URL.
- For routine frontend and sidebar iterations, use this verification loop by default:
  - run `pnpm dev` for the feedback loop
  - run focused `eslint` only on touched files
  - run targeted tests only for the touched logic or behavior
- Do not run `pnpm --filter @webhealth/web build` after every small UI tweak.
- Run a web build only when the user explicitly asks for it or when the change is a larger structural change such as routing, layout architecture, import boundaries, or server/client rendering behavior.
