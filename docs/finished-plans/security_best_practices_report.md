# Dependency Alert Review

Date: March 11, 2026

## Executive Summary

GitHub Dependabot currently shows 24 open dependency alert rows for this repository, but those collapse to 9 unique advisories. Half of the rows were duplicate findings caused by scanning both `pnpm-lock.yaml` and a stray `package-lock.json` in a repository that is explicitly `pnpm`-managed. I removed `package-lock.json`, added targeted `pnpm` overrides, and regenerated the lockfile so the Hono and minimatch advisories are locally resolved. One residual advisory remains in the dependency graph: `esbuild@0.18.20`, pulled in by `@esbuild-kit/core-utils` through tooling-only `drizzle-kit` paths.

## Findings

### WH-DEP-001

- Severity: High
- Status: Fixed locally
- Location: [package.json](/Users/cancelcloud/Developer/DevBrew/WebHealth/package.json#L4), deleted `package-lock.json`, [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L1)
- Evidence: The repo declares `packageManager: "pnpm@10.18.2"` in `package.json`, but also had a committed `package-lock.json`, and GitHub was raising duplicate alerts for both manifests.
- Impact: Each vulnerable transitive was reported twice, which inflated the alert count and obscured the real remediation work.
- Fix: Remove `package-lock.json` and keep `pnpm-lock.yaml` as the single source of truth.

### WH-DEP-002

- Severity: High
- Status: Fixed locally
- Location: [apps/web/package.json](/Users/cancelcloud/Developer/DevBrew/WebHealth/apps/web/package.json#L56), [package.json](/Users/cancelcloud/Developer/DevBrew/WebHealth/package.json#L18), [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L943), [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L4048), [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L4365)
- Evidence: `shadcn` is a dev dependency in `apps/web/package.json`. `pnpm why --recursive` traces `hono`, `@hono/node-server`, and `express-rate-limit` to `shadcn -> @modelcontextprotocol/sdk`. The regenerated lockfile now resolves those packages to `hono@4.12.7`, `@hono/node-server@1.19.10`, and `express-rate-limit@8.2.2`.
- Impact: These advisories were real in the lockfile, but they were confined to CLI-only tooling and not imported by the shipped web or worker application code.
- Fix: Pin patched versions through `pnpm.overrides` and regenerate the lockfile.

### WH-DEP-003

- Severity: Medium
- Status: Fixed locally
- Location: [package.json](/Users/cancelcloud/Developer/DevBrew/WebHealth/package.json#L18), [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L5053), [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L5057), [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L5064)
- Evidence: Dependabot had flagged `minimatch` advisories across three vulnerable lines. After the override-based reinstall, the lockfile resolves `minimatch@10.2.4`, `minimatch@3.1.4`, and `minimatch@9.0.7`.
- Impact: Some of these paths were dev-only, but `googleapis` and `exceljs` introduced vulnerable `minimatch` versions into runtime dependency chains, so they were worth addressing even though they are transitive.
- Fix: Pin the affected `minimatch` lines to patched versions in `pnpm.overrides`.

### WH-DEP-004

- Severity: Low
- Status: Residual
- Location: [pnpm-lock.yaml](/Users/cancelcloud/Developer/DevBrew/WebHealth/pnpm-lock.yaml#L3852)
- Evidence: `pnpm why --recursive esbuild` still shows `esbuild@0.18.20` only under `drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils`. The advisory is for the esbuild development server CORS behavior, not for general bundling.
- Impact: Practical production exposure is low because this path is tooling-only and not part of the deployed Next.js or worker runtime. The remaining risk is local developer exposure if that specific esbuild serve feature is used through this transitive chain.
- Fix: Prefer an upstream fix from `@esbuild-kit/core-utils` or dismiss the alert in GitHub with a tooling-only justification. Forcing a newer `esbuild` into that package would be a higher-risk override because it crosses 0.x minor boundaries.

## Current State

- Locally resolved: all Hono, `@hono/node-server`, `express-rate-limit`, and `minimatch` advisories that were present in the lockfile.
- Removed duplicate scan source: `package-lock.json`.
- Remaining local advisory candidate: `esbuild@0.18.20` in a tooling-only path.
- Remote GitHub alerts will not change until these commits are pushed and Dependabot reprocesses the default branch.
