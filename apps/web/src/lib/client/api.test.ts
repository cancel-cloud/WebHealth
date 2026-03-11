import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { AppError } from "./app-error";
import { requestJsonWith } from "./api";

const originalFetch = globalThis.fetch;

function createResponse(body: string | null, init: ResponseInit) {
  const headers =
    body === null ? undefined : { "Content-Type": "application/json" };

  return new Response(body, {
    headers,
    ...init,
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("requestJson returns parsed JSON for successful responses", async () => {
  const result = await requestJsonWith<{ ok: boolean }>(
    {
      fetcher: async () =>
        createResponse(JSON.stringify({ ok: true }), { status: 200 }),
      reportError: () => {
        throw new Error("should not report");
      },
    },
    "/api/test",
  );

  assert.deepEqual(result, { ok: true });
});

test("requestJson returns null for successful empty responses", async () => {
  const result = await requestJsonWith(
    {
      fetcher: async () => new Response(null, { status: 204 }),
      reportError: () => {
        throw new Error("should not report");
      },
    },
    "/api/test",
  );

  assert.equal(result, null);
});

test("requestJson throws a handled AppError for code/message payloads", async () => {
  await assert.rejects(
    requestJsonWith(
      {
        fetcher: async () =>
          createResponse(
            JSON.stringify({
              error: "PLAN_LIMIT_EXCEEDED",
              message: "Upgrade to create more reports.",
            }),
            { status: 402 },
          ),
        reportError: () => {
          throw new Error("should not report handled errors");
        },
      },
      "/api/test",
    ),
    (error) => {
      assert(error instanceof AppError);
      assert.equal(error.message, "Upgrade to create more reports.");
      assert.equal(error.code, "PLAN_LIMIT_EXCEEDED");
      assert.equal(error.status, 402);
      assert.equal(error.handled, true);
      return true;
    },
  );
});

test("requestJson throws a handled AppError for safe error/code payloads", async () => {
  await assert.rejects(
    requestJsonWith(
      {
        fetcher: async () =>
          createResponse(
            JSON.stringify({
              error: "Internal server error",
              code: "INTERNAL_SERVER_ERROR",
            }),
            { status: 500 },
          ),
        reportError: () => {
          throw new Error("should not report handled errors");
        },
      },
      "/api/test",
    ),
    (error) => {
      assert(error instanceof AppError);
      assert.equal(error.message, "Internal server error");
      assert.equal(error.code, "INTERNAL_SERVER_ERROR");
      assert.equal(error.status, 500);
      assert.equal(error.handled, true);
      return true;
    },
  );
});

test("requestJson reports and throws invalid JSON responses", async () => {
  const reported: unknown[] = [];

  await assert.rejects(
    requestJsonWith(
      {
        fetcher: async () => createResponse("{", { status: 200 }),
        reportError: (error) => {
          reported.push(error);
        },
      },
      "/api/test",
    ),
    (error) => {
      assert(error instanceof AppError);
      assert.equal(error.code, "INVALID_JSON_RESPONSE");
      assert.equal(error.handled, false);
      return true;
    },
  );

  assert.equal(reported.length, 1);
});

test("requestJson reports and rethrows network failures", async () => {
  const reported: unknown[] = [];
  const networkError = new Error("socket hang up");

  await assert.rejects(
    requestJsonWith(
      {
        fetcher: async () => {
          throw networkError;
        },
        reportError: (error) => {
          reported.push(error);
        },
      },
      "/api/test",
    ),
    (error) => {
      assert.equal(error, networkError);
      return true;
    },
  );

  assert.deepEqual(reported, [networkError]);
});
