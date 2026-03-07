import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeCrawlUrl,
  crawlWebsite,
  createCrawlScope,
  isBlockedCrawlIpAddress,
  normalizeCrawlUrl,
} from "./crawl";

test("blocks local and reserved IP ranges for crawl targets", () => {
  assert.equal(isBlockedCrawlIpAddress("127.0.0.1"), true);
  assert.equal(isBlockedCrawlIpAddress("10.0.0.8"), true);
  assert.equal(isBlockedCrawlIpAddress("169.254.169.254"), true);
  assert.equal(isBlockedCrawlIpAddress("fe80::1"), true);
  assert.equal(isBlockedCrawlIpAddress("93.184.216.34"), false);
});

test("rejects http crawl targets by default and only allows explicit local dev http", () => {
  const hostScope = createCrawlScope("https://example.com");

  assert.equal(
    normalizeCrawlUrl("https://example.com", "http://example.com/about", hostScope),
    null
  );
  assert.equal(
    normalizeCrawlUrl(
      "http://localhost:3000",
      "http://localhost:3000/about",
      createCrawlScope("http://localhost:3000"),
      { allowHttpLocalhost: true }
    ),
    "http://localhost:3000/about"
  );
});

test("rejects crawl targets that resolve to blocked addresses", async () => {
  await assert.rejects(
    () =>
      assertSafeCrawlUrl("https://example.com", createCrawlScope("https://example.com"), {
        dnsLookup: async () => [{ address: "10.0.0.9", family: 4 }],
      }),
    /Blocked crawl target address/
  );
});

test("enforces exact-host scope for verified URL properties", async () => {
  await assert.rejects(
    () =>
      assertSafeCrawlUrl("https://blog.example.com/about", createCrawlScope("https://example.com"), {
        dnsLookup: async () => [{ address: "93.184.216.34", family: 4 }],
      }),
    /escaped verified scope/
  );
});

test("allows subdomains for verified sc-domain properties", async () => {
  const allowedUrl = await assertSafeCrawlUrl(
    "https://blog.example.com/about",
    createCrawlScope("sc-domain:example.com"),
    {
      dnsLookup: async () => [{ address: "93.184.216.34", family: 4 }],
    }
  );

  assert.equal(allowedUrl.toString(), "https://blog.example.com/about");
});

test("crawlWebsite only visits in-scope pages", async () => {
  const fetchedUrls: string[] = [];
  const htmlByUrl = new Map<string, string>([
    [
      "https://example.com/",
      `
        <html>
          <head><title>Home</title><meta name="description" content="desc" /></head>
          <body>
            <h1>Home</h1>
            <a href="/about?utm=1#section">About</a>
            <a href="https://evil.example.net/offsite">Offsite</a>
            <a href="https://blog.example.com/other-host">Wrong Host</a>
          </body>
        </html>
      `,
    ],
    [
      "https://example.com/about",
      `
        <html>
          <head><title>About</title><meta name="description" content="desc" /></head>
          <body><h1>About</h1></body>
        </html>
      `,
    ],
  ]);

  const result = await crawlWebsite("https://example.com/", 10, {
    dnsLookup: async () => [{ address: "93.184.216.34", family: 4 }],
    fetchImpl: async (input) => {
      const url = String(input);
      fetchedUrls.push(url);
      const html = htmlByUrl.get(url);
      return new Response(html ?? null, { status: html ? 200 : 404 });
    },
  });

  assert.deepEqual(fetchedUrls, ["https://example.com/", "https://example.com/about"]);
  assert.equal(result.pages.length, 2);
});
