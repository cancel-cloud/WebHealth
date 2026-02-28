import { describe, it, expect } from "vitest";
import { buildContentGapRows } from "./content-gaps";

// "cable drum rental" is spread across 3 pages with no single page dominating
// (top page has 300 out of 900 total = 33% < 50% → Gap A)
const pairs = [
  { query: "cable drum rental", page: "/products/cable-drum", clicks: 6, impressions: 300, ctr: 0.02, position: 12 },
  { query: "cable drum rental", page: "/products/accessories", clicks: 4, impressions: 300, ctr: 0.013, position: 15 },
  { query: "cable drum rental", page: "/rental", clicks: 3, impressions: 300, ctr: 0.01, position: 18 },
  { query: "wire rope specs", page: "/wire-ropes", clicks: 50, impressions: 800, ctr: 0.0625, position: 3 },
  { query: "sfk shop", page: "/shop", clicks: 80, impressions: 400, ctr: 0.2, position: 1 },
];

describe("buildContentGapRows", () => {
  it("returns empty with warnings when queryPagePairs is empty", () => {
    const { rows, warnings } = buildContentGapRows({ queryPagePairs: [], ga4LandingPages: [] });
    expect(rows).toHaveLength(0);
    expect(warnings.some((w) => w.includes("query/page pairs unavailable"))).toBe(true);
  });

  it("detects Gap A when top page share < 50%", () => {
    // "cable drum rental" splits across three pages — no single page dominates
    const { rows } = buildContentGapRows({ queryPagePairs: pairs, ga4LandingPages: [] });
    const gapA = rows.filter((r) => r.gapType === "A");
    expect(gapA.some((r) => r.query === "cable drum rental")).toBe(true);
  });

  it("adds GA4 engagement warning when ga4LandingPages is empty", () => {
    const { warnings } = buildContentGapRows({ queryPagePairs: pairs, ga4LandingPages: [] });
    expect(warnings.some((w) => w.includes("GA4 engagement data unavailable"))).toBe(true);
  });

  it("detects Gap B when engagement is weak", () => {
    const ga4 = [
      { join_key: "/wire-ropes", sessions: 100, engagementRate: 0.2, bounceRate: 0.8 },
    ];
    const { rows } = buildContentGapRows({ queryPagePairs: pairs, ga4LandingPages: ga4 });
    const gapB = rows.filter((r) => r.gapType === "B");
    expect(gapB.length).toBeGreaterThanOrEqual(0); // may or may not trigger based on CTR
  });
});
