import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

export const DEMO_REPORT_ID = "demo";

export const DEMO_DOMAIN = "example-store.com";

export const DEMO_GSC_CURRENT = {
  clicks: 4821,
  impressions: 98340,
  ctr: 0.049,
  position: 14.2,
};

export const DEMO_GSC_COMPARE = {
  clicks: 3914,
  impressions: 87150,
  ctr: 0.044,
  position: 16.8,
};

export const DEMO_GA4_CURRENT = {
  sessions: 6102,
  users: 4891,
};

export const DEMO_GA4_COMPARE = {
  sessions: 5187,
  users: 4102,
};

export const DEMO_AI_REPORT: AiSeoReport = {
  metadata: {
    language: "en",
    schemaVersion: "v3",
    reportTitle: "SEO Audit — example-store.com",
    periodLabel: "Feb 1 – Feb 28 vs Jan 1 – Jan 28, 2026",
    createdAtIso: "2026-02-28T10:00:00Z",
  },

  dashboardMarkdown: `## Summary

This report covers **example-store.com** for February 2026 vs January 2026.

**Organic clicks are up +23%** this month, driven by improved positions on your top commercial keywords. However, three high-traffic product pages lost significant ranking and need immediate attention.

Your site crawl found **8 pages missing meta descriptions** and **3 broken internal links** — both easy wins to fix this week.`,

  executiveSummary: {
    headline:
      "Strong click growth (+23%) masked by position losses on 3 key product pages. Fix the technical issues first, then target the 12 near-win keywords sitting at position 11–20.",
    topActionAreas: [
      "Fix 3 broken internal links on /products and /blog categories",
      "Add meta descriptions to 8 product pages (avg position 9.2 — easy CTR gain)",
      "Target 12 near-win keywords ranked 11–20 with focused content updates",
      "Address content decay on /blog/email-marketing-tips (peak was 6 months ago)",
    ],
  },

  kpiComparisonRows: [
    { metric: "Clicks", previous: "3,914", current: "4,821", delta: "+907 (+23%)", assessment: "Strong growth" },
    { metric: "Impressions", previous: "87,150", current: "98,340", delta: "+11,190 (+13%)", assessment: "Good" },
    { metric: "CTR", previous: "4.4%", current: "4.9%", delta: "+0.5pp", assessment: "Improving" },
    { metric: "Avg Position", previous: "16.8", current: "14.2", delta: "-2.6 (better)", assessment: "Positive" },
    { metric: "Sessions (GA4)", previous: "5,187", current: "6,102", delta: "+915 (+18%)", assessment: "Strong" },
  ],

  kpiTrendRows: [
    { date: "2026-02-01", clicksCurrent: 142, clicksCompare: 118, impressionsCurrent: 3100, impressionsCompare: 2800, ctrCurrent: 0.046, ctrCompare: 0.042, positionCurrent: 15.1, positionCompare: 17.2 },
    { date: "2026-02-04", clicksCurrent: 168, clicksCompare: 131, impressionsCurrent: 3400, impressionsCompare: 2950, ctrCurrent: 0.049, ctrCompare: 0.044, positionCurrent: 14.8, positionCompare: 16.9 },
    { date: "2026-02-07", clicksCurrent: 182, clicksCompare: 140, impressionsCurrent: 3620, impressionsCompare: 3100, ctrCurrent: 0.050, ctrCompare: 0.045, positionCurrent: 14.5, positionCompare: 16.5 },
    { date: "2026-02-10", clicksCurrent: 175, clicksCompare: 138, impressionsCurrent: 3550, impressionsCompare: 3050, ctrCurrent: 0.049, ctrCompare: 0.045, positionCurrent: 14.3, positionCompare: 16.6 },
    { date: "2026-02-13", clicksCurrent: 195, clicksCompare: 145, impressionsCurrent: 3800, impressionsCompare: 3200, ctrCurrent: 0.051, ctrCompare: 0.045, positionCurrent: 14.0, positionCompare: 16.4 },
    { date: "2026-02-16", clicksCurrent: 188, clicksCompare: 148, impressionsCurrent: 3700, impressionsCompare: 3180, ctrCurrent: 0.051, ctrCompare: 0.047, positionCurrent: 13.9, positionCompare: 16.2 },
    { date: "2026-02-19", clicksCurrent: 201, clicksCompare: 142, impressionsCurrent: 3900, impressionsCompare: 3060, ctrCurrent: 0.052, ctrCompare: 0.046, positionCurrent: 13.7, positionCompare: 16.5 },
    { date: "2026-02-22", clicksCurrent: 210, clicksCompare: 155, impressionsCurrent: 4050, impressionsCompare: 3250, ctrCurrent: 0.052, ctrCompare: 0.048, positionCurrent: 13.5, positionCompare: 15.9 },
    { date: "2026-02-25", clicksCurrent: 218, clicksCompare: 158, impressionsCurrent: 4100, impressionsCompare: 3310, ctrCurrent: 0.053, ctrCompare: 0.048, positionCurrent: 13.4, positionCompare: 15.8 },
    { date: "2026-02-28", clicksCurrent: 225, clicksCompare: 162, impressionsCurrent: 4200, impressionsCompare: 3350, ctrCurrent: 0.054, ctrCompare: 0.048, positionCurrent: 13.2, positionCompare: 15.6 },
  ],

  lostClickEstimateRows: [
    {
      query: "buy running shoes online",
      impressions: 8420,
      actualCtr: 0.021,
      benchmarkCtr: 0.089,
      positionBucket: 5,
      estimatedLostClicks: 572,
      confidence: 0.91,
      actionDetail:
        "**Root cause:** Position 5.2 with a 2.1% CTR — well below the 8.9% benchmark for this bucket.\n\n**Recommended fix:** Rewrite the `<title>` tag on `/products/running-shoes` to include a price signal or social proof, e.g. `Buy Running Shoes Online — Free Returns | example-store.com`. This alone could lift CTR to 4–5%.\n\nAlso add FAQ schema markup for common questions (sizing, returns policy) to earn a rich result.",
    },
    {
      query: "best trail running shoes 2026",
      impressions: 5810,
      actualCtr: 0.014,
      benchmarkCtr: 0.071,
      positionBucket: 6,
      estimatedLostClicks: 332,
      confidence: 0.87,
      actionDetail:
        "**Root cause:** Position 6.4 with 1.4% CTR. The page lacks the current year in the title, which searchers expect for 'best of' queries.\n\n**Fix:** Update title to `Best Trail Running Shoes 2026 — Tested & Ranked`. Add a table-of-contents with jump links at the top of the page to improve dwell time, which correlates with higher positions for this query class.",
    },
    {
      query: "waterproof hiking boots women",
      impressions: 4200,
      actualCtr: 0.028,
      benchmarkCtr: 0.095,
      positionBucket: 4,
      estimatedLostClicks: 282,
      confidence: 0.83,
      actionDetail:
        "**Root cause:** Position 4.1 but CTR (2.8%) is 70% below benchmark. The meta description is missing on this page, causing Google to auto-generate a snippet that doesn't convert.\n\n**Fix:** Write a compelling meta description: `Shop waterproof hiking boots for women. Gore-Tex lined, free UK delivery, 30-day returns. Sizes 3–11.`",
    },
  ],

  nearWinKeywordRows: [
    {
      keyword: "trail running shoes sale",
      position: 11.2,
      impressions: 3200,
      clicks: 48,
      ctr: 0.015,
      targetLandingPage: "/products/trail-running-shoes",
      action: "Add 'sale' section to page, update internal links from blog posts",
      estimatedImpact: 145,
      actionDetail:
        "This keyword is 1.2 positions from page 1. The page currently has no content about sales or discounts — adding a 'Current Offers' section near the top and linking from 3 high-traffic blog posts could push it onto page 1 within 4–6 weeks.",
    },
    {
      keyword: "running shoe width guide",
      position: 13.8,
      impressions: 2100,
      clicks: 22,
      ctr: 0.010,
      targetLandingPage: "/blog/running-shoe-fit-guide",
      action: "Expand guide with width measurement instructions and comparison table",
      estimatedImpact: 98,
      actionDetail:
        "Create a 'How to measure your foot width' section with an infographic. Add a comparison table of narrow/standard/wide last widths. Target 800 additional words. This topic has strong featured snippet potential.",
    },
    {
      keyword: "merino wool running socks",
      position: 14.5,
      impressions: 1850,
      clicks: 18,
      ctr: 0.010,
      targetLandingPage: "/products/running-socks",
      action: "Create dedicated merino wool socks category or landing page",
      estimatedImpact: 76,
      actionDetail: null,
    },
  ],

  contentDecayRows: [
    {
      page: "/blog/email-marketing-tips",
      peakClicks: 890,
      recentClicks: 210,
      decayRatio: 0.76,
      peakDate: "2025-08",
      estimatedLostClicks: 680,
      severity: "HOCH",
      actionDetail:
        "This page peaked in August 2025 and has lost 76% of its traffic. The topic is competitive and the content hasn't been updated since 2024.\n\n**Action plan:**\n1. Add a 2026 update section covering AI-powered email tools\n2. Refresh statistics (cite fresh sources)\n3. Add 3 new FAQ entries targeting long-tail variants\n4. Request backlinks from 2 partner sites that previously linked to this content",
    },
    {
      page: "/blog/best-running-shoes-flat-feet",
      peakClicks: 560,
      recentClicks: 195,
      decayRatio: 0.65,
      peakDate: "2025-10",
      estimatedLostClicks: 365,
      severity: "MITTEL",
      actionDetail: null,
    },
  ],

  cannibalizationRows: [
    {
      query: "running shoes for beginners",
      pages: ["/products/beginner-running-shoes", "/blog/best-running-shoes-beginners"],
      totalClicks: 312,
      totalImpressions: 8900,
      recommendation:
        "Consolidate intent. Make the product page the primary target by adding a buying guide section. Redirect or noindex the blog post.",
      actionDetail:
        "The two pages split clicks 180/132 and confuse Google about which should rank. Merge the best content from the blog post into the product page under an 'Buying Guide' tab. Then 301-redirect the blog post to the product page. Expect consolidated ranking within 6–8 weeks.",
    },
  ],

  queryOpportunityRows: [
    { query: "waterproof trail running shoes", clicks: 89, impressions: 4100, ctr: 0.022, position: 8.1, expectedCtr: 0.058, lostClicksEstimate: 148, opportunityScore: 82, recommendedAction: "Add waterproof/Gore-Tex attribute filter to category page", confidence: 0.88, actionDetail: null },
    { query: "running shoes wide feet", clicks: 65, impressions: 3800, ctr: 0.017, position: 9.3, expectedCtr: 0.047, lostClicksEstimate: 114, opportunityScore: 71, recommendedAction: "Create dedicated wide-fit landing page with filtering", confidence: 0.81, actionDetail: null },
    { query: "online shoe store free returns", clicks: 44, impressions: 5200, ctr: 0.008, position: 12.4, expectedCtr: 0.039, lostClicksEstimate: 165, opportunityScore: 68, recommendedAction: "Feature returns policy in hero section with trust badge", confidence: 0.75, actionDetail: null },
  ],

  pageWinnerLoserRows: [
    { page: "/products/trail-running-shoes", clicksCurrent: 892, clicksCompare: 612, clicksDelta: 280, impressionsCurrent: 18200, impressionsCompare: 14100, impressionsDelta: 4100, status: "winner", isStatisticallySignificant: true, zScore: 3.2, actionDetail: null },
    { page: "/products/running-socks", clicksCurrent: 312, clicksCompare: 418, clicksDelta: -106, impressionsCurrent: 8900, impressionsCompare: 9400, impressionsDelta: -500, status: "loser", isStatisticallySignificant: true, zScore: -2.8, actionDetail: "This page dropped after the site restructure on Feb 8. Check if internal links from /products were updated. The page has lost 3 backlinks from external sites — investigate if they were redirected incorrectly." },
    { page: "/blog/running-shoe-fit-guide", clicksCurrent: 234, clicksCompare: 156, clicksDelta: 78, impressionsCurrent: 6200, impressionsCompare: 4800, impressionsDelta: 1400, status: "winner", isStatisticallySignificant: false, zScore: 1.4, actionDetail: null },
    { page: "/products/hiking-boots", clicksCurrent: 189, clicksCompare: 287, clicksDelta: -98, impressionsCurrent: 7100, impressionsCompare: 7800, impressionsDelta: -700, status: "loser", isStatisticallySignificant: true, zScore: -2.4, actionDetail: null },
  ],

  technicalIssueRows: [
    { issueType: "Missing meta description", affectedPages: 8, affectedEstimatedClicks: 420, severity: "HOCH", recommendation: "Write meta descriptions for all 8 product pages. Focus on commercial intent language with a clear value proposition." },
    { issueType: "Broken internal links (4xx)", affectedPages: 3, affectedEstimatedClicks: 180, severity: "KRITISCH", recommendation: "Fix or redirect 3 broken internal links found on /products/running-shoes, /blog, and /categories/sale." },
    { issueType: "Missing H1 tag", affectedPages: 2, affectedEstimatedClicks: 95, severity: "MITTEL", recommendation: "Add unique H1 tags to /products/accessories and /sale. Current pages use H2 as the primary heading." },
    { issueType: "Duplicate title tags", affectedPages: 4, affectedEstimatedClicks: 210, severity: "MITTEL", recommendation: "4 product category pages share the same title pattern. Differentiate with specific category names and keyword targets." },
  ],

  actionBacklogRows: [
    { id: "ab-1", area: "technical", task: "Fix 3 broken internal links on /products and /blog", ownerHint: "developer", effort: "S", impactScore: 9.2, why: "Broken links lose PageRank and create poor user experience. These pages have inbound links from top-10 traffic pages.", done: false, actionDetail: "**Broken links found:**\n- `/products/running-shoes` → `/collections/mens-running` (404)\n- `/blog/category/training` → `/blog/training` (404)\n- `/categories/sale` → `/sale` (404)\n\n**Fix:** Create 301 redirects for all three. Then update the source links to use the correct destination URLs." },
    { id: "ab-2", area: "onpage", task: "Write meta descriptions for 8 product pages", ownerHint: "seo", effort: "S", impactScore: 8.8, why: "These pages rank position 6–12 with no meta description. A compelling snippet can lift CTR by 2–3% at these positions.", done: false, actionDetail: null },
    { id: "ab-3", area: "content", task: "Refresh /blog/email-marketing-tips with 2026 content", ownerHint: "content", effort: "M", impactScore: 8.1, why: "76% traffic decay since peak. The topic is still high-volume but competitors have published more recent content.", done: false, actionDetail: null },
    { id: "ab-4", area: "technical", task: "Add structured data (Product schema) to product pages", ownerHint: "developer", effort: "M", impactScore: 7.5, why: "Competitors in positions 1–3 all have Product rich results. Adding price, availability, and review schema can improve CTR significantly.", done: false, actionDetail: null },
    { id: "ab-5", area: "content", task: "Resolve keyword cannibalization: running shoes for beginners", ownerHint: "seo", effort: "S", impactScore: 7.2, why: "Two pages splitting clicks 180/132. Consolidating will concentrate ranking signals.", done: false, actionDetail: null },
    { id: "ab-6", area: "onpage", task: "Add H1 tags to /products/accessories and /sale", ownerHint: "developer", effort: "S", impactScore: 6.8, why: "Missing H1 is a basic on-page signal. Both pages have traffic potential and are missing this fundamental element.", done: false, actionDetail: null },
  ],

  contentAuditRows: [
    { page: "/products/running-shoes", currentState: "Generic product listing, no unique content", problem: "No differentiating content, weak internal links", recommendation: "Add a 200-word buying guide section above the fold, targeting branded + generic queries", keywordPotential: "High — 3 near-win keywords", effort: "M", priority: "HOCH" },
    { page: "/blog/best-trail-shoes", currentState: "Good base content, dated statistics (2024)", problem: "Losing to fresher competitor content", recommendation: "Update statistics, add 2026 picks section, refresh meta title with year", keywordPotential: "Medium — 2 near-win keywords", effort: "S", priority: "MITTEL" },
  ],

  keywordLandingpageRows: [
    { keyword: "buy trail running shoes uk", impressions: "4,200", currentPosition: "11.4", currentLandingpage: "/products/trail-running-shoes", recommendedLandingpage: "/products/trail-running-shoes", missingContent: "UK shipping mention, price range in meta title", priority: "HOCH" },
  ],

  faqPlanRows: [
    { category: "Product", question: "What's the difference between trail and road running shoes?", targetKeyword: "trail vs road running shoes", priority: "MITTEL" },
    { category: "Shipping", question: "Do you offer free returns on running shoes?", targetKeyword: "free returns running shoes uk", priority: "HOCH" },
  ],

  technicalQuickWinRows: [
    { index: 1, measure: "Fix broken internal links", problem: "3 internal links returning 404", solution: "Add 301 redirects + update source links", effort: "S", impact: "KRITISCH" },
    { index: 2, measure: "Add missing meta descriptions", problem: "8 product pages without meta description", solution: "Write unique descriptions per page, include price signal", effort: "S", impact: "HOCH" },
    { index: 3, measure: "Fix duplicate title tags", problem: "4 category pages with identical title patterns", solution: "Differentiate titles with unique keywords per category", effort: "S", impact: "MITTEL" },
  ],

  actionPlanRows: [
    { phase: "Week 1", week: "1", measure: "Fix broken links + meta descriptions", description: "Technical quick wins with immediate impact", owner: "Dev + SEO", status: "todo" },
    { phase: "Week 2", week: "2", measure: "Content refresh: blog posts", description: "Update decaying content with 2026 data", owner: "Content", status: "todo" },
    { phase: "Week 3", week: "3", measure: "Target near-win keywords", description: "Focused updates to push 12 keywords from page 2 to page 1", owner: "SEO", status: "todo" },
    { phase: "Week 4", week: "4", measure: "Add structured data", description: "Product schema on all product pages", owner: "Dev", status: "todo" },
  ],

  clientChecklistRows: [
    { index: 1, requiredItem: "Google Search Console access", description: "Verified read access to all properties", forPhase: "Setup", status: "done" },
    { index: 2, requiredItem: "Broken links fixed", description: "3 internal 404 links", forPhase: "Week 1", status: "todo" },
    { index: 3, requiredItem: "Meta descriptions written", description: "8 product pages", forPhase: "Week 1", status: "todo" },
  ],

  siteChanges: {
    newPages: [
      { url: "https://example-store.com/products/spring-2026-collection" },
    ],
    changedPages: [
      { url: "https://example-store.com/products/trail-running-shoes", changedFields: ["title", "metaDescription"] },
      { url: "https://example-store.com/blog/running-shoe-fit-guide", changedFields: ["h1Texts"] },
    ],
    removedPages: [],
  },

  alertsAndFlags: {
    contentDecayDetected: true,
    significantLosers: ["/products/running-socks", "/products/hiking-boots"],
    cannibalizationCount: 1,
    criticalTechnicalIssues: 1,
  },

  scoringMethodology: {
    ctrBenchmarkSource: "site-specific",
    significanceTestUsed: true,
    decayWindowDays: 90,
    insightSchemaVersion: "v3",
  },
};
