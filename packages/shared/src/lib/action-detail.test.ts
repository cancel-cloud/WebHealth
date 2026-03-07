import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeActionDetailPayload } from "./action-detail";

test("sanitizeActionDetailPayload strips unsafe affected urls", () => {
  assert.deepEqual(
    sanitizeActionDetailPayload({
      affectedUrls: ["https://example.com/page", "javascript:alert(1)", "data:text/html,hi"],
      fixSteps: [" Step 1 ", "", "Step 2"],
      whyItMatters: "  Important. ",
    }),
    {
      affectedUrls: ["https://example.com/page"],
      fixSteps: ["Step 1", "Step 2"],
      whyItMatters: "Important.",
    }
  );
});
