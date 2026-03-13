import assert from "node:assert/strict";
import test from "node:test";

import { getGlitchTipTestStatus } from "./glitchtip-test.logic";

test("getGlitchTipTestStatus returns ready when the public DSN is configured", () => {
  const status = getGlitchTipTestStatus({
    NEXT_PUBLIC_SENTRY_DSN: "https://public@example-glitchtip.dev/1",
    SENTRY_ENVIRONMENT: "development",
    SENTRY_RELEASE: "2026-03-13-glitchtip-test",
  });

  assert.deepEqual(status, {
    configured: true,
    dsn: "https://public@example-glitchtip.dev/1",
    environment: "development",
    release: "2026-03-13-glitchtip-test",
  });
});

test("getGlitchTipTestStatus returns not configured when the public DSN is missing", () => {
  const status = getGlitchTipTestStatus({
    NEXT_PUBLIC_SENTRY_DSN: "",
    SENTRY_ENVIRONMENT: "production",
    SENTRY_RELEASE: "release-1",
  });

  assert.deepEqual(status, {
    configured: false,
    dsn: null,
    environment: "production",
    release: "release-1",
  });
});

test("getGlitchTipTestStatus trims values and keeps optional metadata nullable", () => {
  const status = getGlitchTipTestStatus({
    NEXT_PUBLIC_SENTRY_DSN: "  https://public@example-glitchtip.dev/1  ",
    SENTRY_ENVIRONMENT: "   ",
    SENTRY_RELEASE: "   ",
  });

  assert.deepEqual(status, {
    configured: true,
    dsn: "https://public@example-glitchtip.dev/1",
    environment: null,
    release: null,
  });
});
