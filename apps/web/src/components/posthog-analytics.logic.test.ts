import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPosthogBrowserConfig,
  getPosthogIdentityAction,
  isPosthogBrowserEnabled,
  sanitizeAnalyticsUrl,
} from "./posthog-analytics.logic";

test("PostHog browser config uses managed proxy and EU UI host", () => {
  assert.deepEqual(
    buildPosthogBrowserConfig({
      key: "phc_test",
      captureHost: "https://d.devbrew.dev/",
      uiHost: "https://eu.posthog.com/",
    }),
    {
      api_host: "https://d.devbrew.dev",
      ui_host: "https://eu.posthog.com",
      defaults: "2026-01-30",
      person_profiles: "identified_only",
      capture_pageview: false,
      autocapture: true,
    },
  );
});

test("PostHog browser tracking only enables after analytics consent with a key", () => {
  assert.equal(isPosthogBrowserEnabled("accepted", "phc_test"), true);
  assert.equal(isPosthogBrowserEnabled("declined", "phc_test"), false);
  assert.equal(isPosthogBrowserEnabled("unknown", "phc_test"), false);
  assert.equal(isPosthogBrowserEnabled("accepted", ""), false);
  assert.equal(isPosthogBrowserEnabled("accepted", "phc_replace_with_client_key"), false);
});

test("analytics URL sanitizer redacts public share tokens", () => {
  assert.equal(
    sanitizeAnalyticsUrl("https://webhealth.devbrew.dev/share/property/ps_secret123?utm_source=x#section"),
    "https://webhealth.devbrew.dev/share/property/[token]",
  );
});

test("analytics URL sanitizer drops query strings from normal routes", () => {
  assert.equal(
    sanitizeAnalyticsUrl("https://webhealth.devbrew.dev/properties/gsc_example?tab=queries"),
    "https://webhealth.devbrew.dev/properties/gsc_example",
  );
});

test("analytics URL sanitizer handles relative URLs", () => {
  assert.equal(
    sanitizeAnalyticsUrl("/share/property/ps_secret123?utm_source=x"),
    "/share/property/[token]",
  );
});

test("PostHog identifies a known user only after consent and initialization", () => {
  assert.deepEqual(
    getPosthogIdentityAction({
      consent: "accepted",
      initialized: true,
      currentIdentifiedUserId: null,
      user: {
        id: "user_pg_123",
        email: "person@example.com",
        name: "Person",
      },
    }),
    {
      type: "identify",
      distinctId: "user_pg_123",
      properties: {
        email: "person@example.com",
        name: "Person",
      },
    },
  );
});

test("PostHog does not identify repeatedly for the same user", () => {
  assert.deepEqual(
    getPosthogIdentityAction({
      consent: "accepted",
      initialized: true,
      currentIdentifiedUserId: "user_pg_123",
      user: { id: "user_pg_123", email: "person@example.com", name: "Person" },
    }),
    { type: "none" },
  );
});

test("PostHog resets after a previously identified user logs out", () => {
  assert.deepEqual(
    getPosthogIdentityAction({
      consent: "accepted",
      initialized: true,
      currentIdentifiedUserId: "user_pg_123",
      user: null,
    }),
    { type: "reset" },
  );
});

test("PostHog identity remains disabled without consent or initialization", () => {
  assert.deepEqual(
    getPosthogIdentityAction({
      consent: "declined",
      initialized: true,
      currentIdentifiedUserId: null,
      user: { id: "user_pg_123", email: "person@example.com", name: "Person" },
    }),
    { type: "none" },
  );
  assert.deepEqual(
    getPosthogIdentityAction({
      consent: "accepted",
      initialized: false,
      currentIdentifiedUserId: null,
      user: { id: "user_pg_123", email: "person@example.com", name: "Person" },
    }),
    { type: "none" },
  );
});
