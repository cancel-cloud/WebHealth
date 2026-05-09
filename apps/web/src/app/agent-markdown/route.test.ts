import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route";

test("agent markdown route returns markdown headers for public documents", async () => {
  const response = GET(new Request("https://webhealth.devbrew.dev/agent-markdown?path=%2Fen"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(response.headers.get("vary"), "Accept");
  assert.match(response.headers.get("x-markdown-tokens") ?? "", /^\d+$/);
  assert.match(await response.text(), /SEO Reporting Software for Agencies/);
});

test("agent markdown route rejects private product paths with plain 404", async () => {
  for (const path of ["/api/properties", "/dashboard", "/admin", "/properties/abc", "/settings"]) {
    const response = GET(
      new Request(`https://webhealth.devbrew.dev/agent-markdown?path=${encodeURIComponent(path)}`),
    );

    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(await response.text(), "Not found");
  }
});
