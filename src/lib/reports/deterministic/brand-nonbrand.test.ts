import { describe, it, expect } from "vitest";
import { splitBrandNonBrand } from "./brand-nonbrand";

const queries = [
  { query: "sfk seilzuege kabelwinde", clicks: 50, impressions: 500, ctr: 0.1, position: 2 },
  { query: "cable drum 500kg", clicks: 20, impressions: 800, ctr: 0.025, position: 8 },
  { query: "drahtseile kaufen", clicks: 15, impressions: 600, ctr: 0.025, position: 12 },
  { query: "sfk seilzug ersatzteile", clicks: 10, impressions: 200, ctr: 0.05, position: 4 },
];

describe("splitBrandNonBrand", () => {
  it("splits branded vs non-branded correctly", () => {
    const result = splitBrandNonBrand(queries, "sfk-seilzuege.de");
    expect(result.branded).toHaveLength(2);
    expect(result.nonBranded).toHaveLength(2);
    expect(result.branded.every((q) => q.query.includes("sfk"))).toBe(true);
  });

  it("calculates brandClickShare correctly", () => {
    const result = splitBrandNonBrand(queries, "sfk-seilzuege.de");
    const totalClicks = 50 + 20 + 15 + 10;
    const brandClicks = 50 + 10;
    expect(result.brandClickShare).toBeCloseTo(brandClicks / totalClicks);
  });

  it("returns all as non-branded for unrelated domain", () => {
    const result = splitBrandNonBrand(queries, "unrelated.de");
    expect(result.branded).toHaveLength(0);
    expect(result.nonBranded).toHaveLength(4);
    expect(result.brandClickShare).toBe(0);
  });
});
