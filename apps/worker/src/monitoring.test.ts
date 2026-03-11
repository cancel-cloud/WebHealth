import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { mock } from "node:test";

import { initWorkerMonitoring, reportWorkerFatalError } from "./monitoring";

const require = createRequire(import.meta.url);
const Sentry = require("@sentry/node") as typeof import("@sentry/node");

test("initWorkerMonitoring skips Sentry init when SENTRY_DSN is missing", () => {
  const init = mock.method(Sentry, "init", () => undefined);

  initWorkerMonitoring({});

  assert.equal(init.mock.calls.length, 0);
  init.mock.restore();
});

test("reportWorkerFatalError captures worker failures and flushes", async () => {
  const tags = new Map<string, string>();
  const contexts = new Map<string, unknown>();
  let level = "";

  const withScope = mock.method(
    Sentry,
    "withScope",
    (
      callback: (scope: {
        setTag: (key: string, value: string) => void;
        setLevel: (value: string) => void;
        setContext: (name: string, value: unknown) => void;
      }) => void,
    ) => {
      callback({
        setTag: (key, value) => {
          tags.set(key, value);
        },
        setLevel: (value) => {
          level = value;
        },
        setContext: (name, value) => {
          contexts.set(name, value);
        },
      });
    },
  );
  const captureException = mock.method(Sentry, "captureException", (error: unknown) => error);
  const close = mock.method(Sentry, "close", async (timeout?: number) => timeout === 2000);

  const error = new Error("connect ECONNREFUSED");
  await reportWorkerFatalError(
    error,
    {
      phase: "database-ready",
      target: "direct-database",
    },
    { SENTRY_DSN: "https://public@example-glitchtip.dev/1" },
  );

  assert.equal(withScope.mock.calls.length, 1);
  assert.equal(captureException.mock.calls.length, 1);
  assert.equal(close.mock.calls.length, 1);
  assert.deepEqual(captureException.mock.calls[0]?.arguments, [error]);
  assert.deepEqual(close.mock.calls[0]?.arguments, [2000]);
  assert.equal(tags.get("error_surface"), "worker");
  assert.equal(tags.get("worker_phase"), "database-ready");
  assert.equal(level, "fatal");
  assert.deepEqual(contexts.get("worker_failure"), {
    phase: "database-ready",
    target: "direct-database",
  });

  withScope.mock.restore();
  captureException.mock.restore();
  close.mock.restore();
});
