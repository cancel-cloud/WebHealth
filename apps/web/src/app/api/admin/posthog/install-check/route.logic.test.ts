import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPosthogInstallCheckConfigStatus,
  shapePosthogInstallCheckResult,
} from "./route.logic";

test("PostHog install check config status masks secrets", () => {
  assert.deepEqual(
    buildPosthogInstallCheckConfigStatus({
      projectToken: "phc_server",
      browserKey: "phc_public",
      captureHost: "https://d.devbrew.dev",
      projectId: "69763",
      uiHost: "https://eu.posthog.com",
    }),
    {
      hasServerProjectToken: true,
      hasBrowserKey: true,
      hasProjectId: true,
      captureHost: "https://d.devbrew.dev",
      uiHost: "https://eu.posthog.com",
      projectId: "69763",
    },
  );
});

test("PostHog install check result exposes status without secrets", () => {
  assert.deepEqual(
    shapePosthogInstallCheckResult({
      ok: true,
      status: 200,
      endpoint: "https://d.devbrew.dev/i/v0/e/",
      eventName: "posthog_install_check_ran",
    }),
    {
      ok: true,
      status: 200,
      endpoint: "https://d.devbrew.dev/i/v0/e/",
      eventName: "posthog_install_check_ran",
    },
  );
});
