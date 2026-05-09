import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route";

test("api catalog returns a plain 404 instead of a fake linkset", async () => {
  const response = GET();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.notEqual(response.headers.get("content-type"), "application/linkset+json");
  assert.equal(await response.text(), "Not found");
});
