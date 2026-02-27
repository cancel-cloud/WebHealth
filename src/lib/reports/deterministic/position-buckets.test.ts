import { describe, it, expect } from "vitest";
import { buildPositionBuckets, buildSegmentSummaryRows } from "./position-buckets";

const currentQueries = [
  { query: "a", clicks: 100, impressions: 400, ctr: 0.25, position: 1 },
  { query: "b", clicks: 50, impressions: 600, ctr: 0.083, position: 5 },
  { query: "c", clicks: 20, impressions: 800, ctr: 0.025, position: 15 },
  { query: "d", clicks: 5, impressions: 1000, ctr: 0.005, position: 30 },
];

const compareQueries = [
  { query: "a", clicks: 80, impressions: 350, ctr: 0.229, position: 2 },
  { query: "b", clicks: 40, impressions: 500, ctr: 0.08, position: 6 },
];

describe("buildPositionBuckets", () => {
  it("produces 5 buckets", () => {
    const result = buildPositionBuckets(currentQueries, compareQueries);
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.bucket)).toEqual(["1-3", "4-10", "11-20", "21-50", "51+"]);
  });

  it("correctly assigns queries to buckets", () => {
    const result = buildPositionBuckets(currentQueries, compareQueries);
    const top3 = result.find((r) => r.bucket === "1-3")!;
    expect(top3.clicksCurrent).toBe(100);
    expect(top3.impressionsCurrent).toBe(400);
  });

  it("calculates CTR correctly", () => {
    const result = buildPositionBuckets(currentQueries, compareQueries);
    const top3 = result.find((r) => r.bucket === "1-3")!;
    expect(top3.ctrCurrent).toBeCloseTo(100 / 400);
  });

  it("computes deltas", () => {
    const result = buildPositionBuckets(currentQueries, compareQueries);
    const top3 = result.find((r) => r.bucket === "1-3")!;
    expect(top3.clicksDelta).toBe(100 - 80);
    expect(top3.impressionsDelta).toBe(400 - 350);
  });
});

describe("buildSegmentSummaryRows", () => {
  it("returns up to 3 devices and 3 countries", () => {
    const result = buildSegmentSummaryRows({
      currentDevices: [
        { device: "desktop", clicks: 100, impressions: 500, ctr: 0.2, position: 5 },
        { device: "mobile", clicks: 60, impressions: 400, ctr: 0.15, position: 7 },
        { device: "tablet", clicks: 10, impressions: 100, ctr: 0.1, position: 10 },
      ],
      compareDevices: [],
      currentCountries: [
        { country: "Germany", clicks: 120, impressions: 600, ctr: 0.2, position: 4 },
        { country: "Austria", clicks: 30, impressions: 200, ctr: 0.15, position: 6 },
        { country: "Switzerland", clicks: 20, impressions: 200, ctr: 0.1, position: 8 },
      ],
      compareCountries: [],
    });
    const devices = result.filter((r) => r.segmentType === "device");
    const countries = result.filter((r) => r.segmentType === "country");
    expect(devices).toHaveLength(3);
    expect(countries).toHaveLength(3);
  });
});
