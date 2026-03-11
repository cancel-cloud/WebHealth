import assert from "node:assert/strict";
import test from "node:test";

import { getPricingBadgeClassNames } from "./pricing-badge-styles";

test("getPricingBadgeClassNames returns the approved pricing badge palette", () => {
  assert.deepEqual(getPricingBadgeClassNames(), {
    base: "inline-flex items-center justify-center rounded-full font-bold uppercase tracking-widest",
    mostPopular: "bg-primary text-primary-foreground",
    mostPopularSpacing: "px-3 py-1 text-[10px]",
    comingSoon: "bg-sky-100 text-sky-700",
    comingSoonSpacing: "px-2 py-0.5 text-[10px]",
  });
});
