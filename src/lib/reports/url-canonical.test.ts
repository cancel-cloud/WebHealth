import { describe, it, expect } from "vitest";
import { normalizeUrl, buildUrlJoinReport, DEFAULT_URL_CONFIG } from "./url-canonical";

describe("normalizeUrl", () => {
  const host = "example.com";

  it("strips utm tracking params", () => {
    const result = normalizeUrl("/blog/post/?utm_source=google&utm_medium=cpc", host);
    expect(result.join_key).toBe("/blog/post");
    expect(result.url_normalized).not.toContain("utm_source");
  });

  it("strips fragment", () => {
    const result = normalizeUrl("/page#section", host);
    expect(result.join_key).toBe("/page");
  });

  it("strips trailing slash by default", () => {
    const result = normalizeUrl("/blog/post/", host);
    expect(result.join_key).toBe("/blog/post");
  });

  it("normalizes percent-encoding", () => {
    const r1 = normalizeUrl("/über-uns", host);
    const r2 = normalizeUrl("/%C3%BCber-uns", host);
    expect(r1.join_key).toBe(r2.join_key);
  });

  it("marks external URLs as unjoinable", () => {
    const result = normalizeUrl("https://other.com/page", host);
    expect(result.unjoinableReason).toBe("external");
  });

  it("handles full URL input", () => {
    const result = normalizeUrl("https://example.com/products?gclid=abc123&color=red", host);
    expect(result.join_key).toBe("/products?color=red");
    expect(result.join_key).not.toContain("gclid");
  });

  it("handles path-only input (GA4 landingPage format)", () => {
    const result = normalizeUrl("/products/cable-drum", host);
    expect(result.join_key).toBe("/products/cable-drum");
    expect(result.unjoinableReason).toBeUndefined();
  });

  it("strips www from host when hostMode is strip-www", () => {
    const result = normalizeUrl("https://www.example.com/page", host);
    expect(result.url_normalized).not.toContain("www.");
  });
});

describe("buildUrlJoinReport", () => {
  it("calculates join rate correctly", () => {
    const gscUrls = [
      normalizeUrl("/page-a", "example.com"),
      normalizeUrl("/page-b", "example.com"),
      normalizeUrl("/page-c", "example.com"),
    ];
    const ga4Urls = [
      normalizeUrl("/page-a", "example.com"),
      normalizeUrl("/page-b", "example.com"),
    ];
    const report = buildUrlJoinReport({ gscUrls, ga4Urls, crawlUrls: [] });
    expect(report.joinRateGscGa4).toBeCloseTo(2/3);
    expect(report.joinedGscGa4).toBe(2);
  });
});
