# WebHealth Styleguide Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a repo-local styleguide skill that captures WebHealth architecture, frontend, backend, and testing conventions and makes them discoverable for future work in this repository.

**Architecture:** Keep the skill small and procedural in `SKILL.md`, then split repo-specific guidance into focused reference files for architecture, frontend, backend, and testing. Add a minimal `AGENTS.md` entry so the local skill is visible at the project root.

**Tech Stack:** Markdown, repo-local skill metadata, Next.js monorepo conventions

---

### Task 1: Create the project skill entry point

**Files:**
- Create: `.agents/skills/styleguide/SKILL.md`
- Create: `AGENTS.md`

**Step 1: Draft the failing expectation**

Expectation: There is no repo-local skill describing WebHealth conventions, and no project metadata entry advertising one.

**Step 2: Verify the gap**

Run: `find . -maxdepth 4 \\( -name 'AGENTS.md' -o -path './.agents/skills/styleguide/*' \\)`
Expected: no local skill files for this project

**Step 3: Write the minimal implementation**

- Add `AGENTS.md` with a single project skill entry
- Add a short `SKILL.md` that routes agents to the right reference file

**Step 4: Verify the files exist**

Run: `find . -maxdepth 4 \\( -name 'AGENTS.md' -o -path './.agents/skills/styleguide/*' \\)`
Expected: `AGENTS.md` and the skill directory appear

### Task 2: Add focused reference guides

**Files:**
- Create: `.agents/skills/styleguide/references/architecture.md`
- Create: `.agents/skills/styleguide/references/frontend.md`
- Create: `.agents/skills/styleguide/references/backend.md`
- Create: `.agents/skills/styleguide/references/testing.md`

**Step 1: Write the missing guidance**

Document the current repo conventions only:
- service boundaries
- file placement
- frontend composition and styling
- route and shared logic structure
- colocated test patterns

**Step 2: Verify the references are scoped**

Run: `sed -n '1,220p' .agents/skills/styleguide/SKILL.md`
Expected: the main skill stays short and delegates details to the reference files

### Task 3: Add lightweight project documentation

**Files:**
- Create: `docs/plans/2026-03-09-styleguide-skill-design.md`
- Create: `docs/plans/2026-03-09-styleguide-skill.md`

**Step 1: Record the approved design**

Write the approved structure and the source files used to derive the conventions.

**Step 2: Verify documentation exists**

Run: `ls docs/plans`
Expected: both March 9, 2026 styleguide documents are listed
