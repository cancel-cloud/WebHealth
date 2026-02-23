import * as cheerio from 'cheerio';

export type PageIssue = {
  url: string;
  issues: string[];
  title?: string;
  metaDescription?: string;
  h1Count: number;
};

export type CrawlResult = {
  pages: PageIssue[];
  brokenLinks: string[];
  summary: {
    missingTitle: number;
    missingMeta: number;
    missingH1: number;
    multipleH1: number;
    brokenLinks: number;
  };
};

const DEFAULT_MAX_PAGES = 50;

async function fetchPage(url: string): Promise<{ html: string; status: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WebAubit-Crawler/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { html: '', status: res.status };
    const html = await res.text();
    return { html, status: res.status };
  } catch {
    return null;
  }
}

function normalizeUrl(base: string, href: string): string | null {
  try {
    const url = new URL(href, base);
    // Only follow same-origin links
    const baseOrigin = new URL(base).origin;
    if (url.origin !== baseOrigin) return null;
    // Strip fragments and query strings for deduplication
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export async function crawlWebsite(
  startUrl: string,
  maxPages = DEFAULT_MAX_PAGES
): Promise<CrawlResult> {
  // Normalize start URL (handle sc-domain: prefix from GSC)
  let urlToStart = startUrl;
  if (startUrl.startsWith('sc-domain:')) {
    urlToStart = `https://${startUrl.replace('sc-domain:', '')}`;
  }

  const visited = new Set<string>();
  const toVisit: string[] = [urlToStart];
  const pages: PageIssue[] = [];
  const brokenLinks: string[] = [];

  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const result = await fetchPage(url);
    if (!result) continue;

    if (result.status >= 400) {
      brokenLinks.push(url);
      continue;
    }

    const $ = cheerio.load(result.html);
    const issues: string[] = [];

    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
    const h1Tags = $('h1');
    const h1Count = h1Tags.length;

    if (!title) issues.push('Missing <title> tag');
    if (!metaDescription) issues.push('Missing meta description');
    if (h1Count === 0) issues.push('Missing <h1> tag');
    if (h1Count > 1) issues.push(`Multiple <h1> tags (${h1Count} found)`);

    pages.push({ url, issues, title, metaDescription, h1Count });

    // Queue internal links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const normalized = normalizeUrl(url, href);
      if (normalized && !visited.has(normalized)) {
        toVisit.push(normalized);
      }
    });
  }

  const summary = {
    missingTitle: pages.filter((p) => p.issues.some((i) => i.includes('<title>'))).length,
    missingMeta: pages.filter((p) => p.issues.some((i) => i.includes('meta description'))).length,
    missingH1: pages.filter((p) => p.h1Count === 0).length,
    multipleH1: pages.filter((p) => p.h1Count > 1).length,
    brokenLinks: brokenLinks.length,
  };

  return { pages, brokenLinks, summary };
}
