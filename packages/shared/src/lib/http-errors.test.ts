import assert from "node:assert/strict";
import test from "node:test";

import { badRequest, toPublicError } from "./http-errors";

test("toPublicError preserves HttpError status and safe payload", () => {
  assert.deepEqual(toPublicError(badRequest("INVALID_INPUT", "Invalid input")), {
    status: 400,
    body: {
      error: "Invalid input",
      code: "INVALID_INPUT",
    },
  });
});

test("toPublicError hides unexpected internal error messages", () => {
  assert.deepEqual(toPublicError(new Error("db exploded")), {
    status: 500,
    body: {
      error: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
  });
});
