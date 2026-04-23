import type { AiSeoReport, RecommendationDetail } from "@webhealth/shared/lib/reports/types";

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

function makeDetail(input: {
  observed: string[];
  likelyCauses: string[];
  recommendedActions: string[];
  whyThisHelps: string[];
  expectedOutcome: string[];
  deterministic?: Array<{ label: string; value: string }>;
  inferred?: string[];
}): RecommendationDetail {
  return {
    observed: input.observed,
    likelyCauses: input.likelyCauses,
    recommendedActions: input.recommendedActions,
    whyThisHelps: input.whyThisHelps,
    expectedOutcome: input.expectedOutcome,
    evidence: {
      deterministic: input.deterministic ?? [],
      inferred: input.inferred ?? [],
    },
  };
}

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
      actionDetail: makeDetail({
        observed: [
          "Position 5.2 with 2.1% CTR is far below the 8.9% benchmark for this position bucket.",
        ],
        likelyCauses: ["The ranking page likely has a weak snippet message for commercial intent."],
        recommendedActions: [
          "Rewrite the title to include a stronger commercial signal such as free returns.",
          "Add FAQ schema if the page supports it.",
        ],
        whyThisHelps: ["Better snippet messaging can lift clicks without needing a ranking increase first."],
        expectedOutcome: ["CTR should improve after recrawl and snippet refresh."],
      }),
    },
    {
      query: "best trail running shoes 2026",
      impressions: 5810,
      actualCtr: 0.014,
      benchmarkCtr: 0.071,
      positionBucket: 6,
      estimatedLostClicks: 332,
      confidence: 0.87,
      actionDetail: makeDetail({
        observed: ["Position 6.4 with 1.4% CTR underperforms the benchmark for this ranking range."],
        likelyCauses: ["The page likely looks stale for a year-sensitive 'best of' query."],
        recommendedActions: [
          "Update the title to include the current year.",
          "Add a clearer top-of-page structure for comparison intent.",
        ],
        whyThisHelps: ["Freshness-sensitive queries respond to explicit current-year signaling."],
        expectedOutcome: ["Snippet response should improve before larger ranking movement."],
      }),
    },
    {
      query: "waterproof hiking boots women",
      impressions: 4200,
      actualCtr: 0.028,
      benchmarkCtr: 0.095,
      positionBucket: 4,
      estimatedLostClicks: 282,
      confidence: 0.83,
      actionDetail: makeDetail({
        observed: ["Position 4.1 but CTR is 2.8%, well below the bucket benchmark."],
        likelyCauses: ["The page is likely missing a convincing meta description."],
        recommendedActions: ["Write a meta description with waterproof, delivery, and returns signals."],
        whyThisHelps: ["A stronger snippet can convert impressions already earned by the page."],
        expectedOutcome: ["The first visible win should be CTR lift after recrawl."],
      }),
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
      actionDetail: makeDetail({
        observed: ["The keyword sits 1.2 positions away from page one with strong impressions."],
        likelyCauses: ["The ranking page likely under-serves discount intent."],
        recommendedActions: [
          "Add sale-focused content to the target page.",
          "Link to the target from relevant high-traffic blog posts.",
        ],
        whyThisHelps: ["Intent alignment plus stronger internal support can help push a near-win term onto page one."],
        expectedOutcome: ["Ranking movement should appear before click growth."],
      }),
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
      actionDetail: makeDetail({
        observed: ["The guide ranks on page two for a high-intent informational query."],
        likelyCauses: ["The page likely lacks enough depth on width-specific intent."],
        recommendedActions: [
          "Add width measurement guidance.",
          "Add a comparison table for fit types.",
        ],
        whyThisHelps: ["Specific subtopic coverage helps the page better satisfy the query intent."],
        expectedOutcome: ["Page-one movement should appear before broad click gains."],
      }),
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
      actionDetail: makeDetail({
        observed: ["The page peaked in August 2025 and has since lost most of its traffic."],
        likelyCauses: ["The topic likely became stale and under-served newer query expectations."],
        recommendedActions: [
          "Add a current-year update section.",
          "Replace outdated stats and add new FAQ coverage.",
        ],
        whyThisHelps: ["Refreshing proven content is faster than rebuilding authority on a new page."],
        expectedOutcome: ["Trend stabilization should appear before full recovery."],
      }),
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
      actionDetail: makeDetail({
        observed: ["The query splits clicks across two competing URLs."],
        likelyCauses: ["Google is receiving mixed primary-page signals for the same term."],
        recommendedActions: [
          "Choose one primary page and consolidate overlapping content.",
          "Redirect or de-optimize the weaker secondary page.",
        ],
        whyThisHelps: ["Consolidation helps one page collect the full ranking signal."],
        expectedOutcome: ["Reduced ranking volatility should appear before full click consolidation."],
      }),
    },
  ],

  queryOpportunityRows: [
    { query: "waterproof trail running shoes", clicks: 89, impressions: 4100, ctr: 0.022, position: 8.1, expectedCtr: 0.058, lostClicksEstimate: 148, opportunityScore: 82, recommendedAction: "Add waterproof/Gore-Tex attribute filter to category page", confidence: 0.88, actionDetail: null },
    { query: "running shoes wide feet", clicks: 65, impressions: 3800, ctr: 0.017, position: 9.3, expectedCtr: 0.047, lostClicksEstimate: 114, opportunityScore: 71, recommendedAction: "Create dedicated wide-fit landing page with filtering", confidence: 0.81, actionDetail: null },
    { query: "online shoe store free returns", clicks: 44, impressions: 5200, ctr: 0.008, position: 12.4, expectedCtr: 0.039, lostClicksEstimate: 165, opportunityScore: 68, recommendedAction: "Feature returns policy in hero section with trust badge", confidence: 0.75, actionDetail: null },
  ],

  pageWinnerLoserRows: [
    { page: "/products/trail-running-shoes", clicksCurrent: 892, clicksCompare: 612, clicksDelta: 280, impressionsCurrent: 18200, impressionsCompare: 14100, impressionsDelta: 4100, status: "winner", isStatisticallySignificant: true, zScore: 3.2, actionDetail: null },
    { page: "/products/running-socks", clicksCurrent: 312, clicksCompare: 418, clicksDelta: -106, impressionsCurrent: 8900, impressionsCompare: 9400, impressionsDelta: -500, status: "loser", isStatisticallySignificant: true, zScore: -2.8, actionDetail: makeDetail({ observed: ["The page dropped after the restructure with both clicks and impressions down."], likelyCauses: ["Internal linking or redirect coverage may have weakened after the change."], recommendedActions: ["Check internal links and lost backlinks pointing to this page."], whyThisHelps: ["It validates whether a change introduced the decline."], expectedOutcome: ["The first visible win is restored linking health before traffic recovery."], }) },
    { page: "/blog/running-shoe-fit-guide", clicksCurrent: 234, clicksCompare: 156, clicksDelta: 78, impressionsCurrent: 6200, impressionsCompare: 4800, impressionsDelta: 1400, status: "winner", isStatisticallySignificant: false, zScore: 1.4, actionDetail: null },
    { page: "/products/hiking-boots", clicksCurrent: 189, clicksCompare: 287, clicksDelta: -98, impressionsCurrent: 7100, impressionsCompare: 7800, impressionsDelta: -700, status: "loser", isStatisticallySignificant: true, zScore: -2.4, actionDetail: null },
  ],

  technicalIssueRows: [
    { issueType: "Missing meta description", affectedPages: 8, affectedEstimatedClicks: 420, severity: "HOCH", recommendation: "Write meta descriptions for all 8 product pages. Focus on commercial intent language with a clear value proposition." },
    { issueType: "Broken internal links (4xx)", affectedPages: 3, affectedEstimatedClicks: 180, severity: "KRITISCH", recommendation: "Fix or redirect 3 broken internal links found on /products/running-shoes, /blog, and /categories/sale." },
    { issueType: "Missing H1 tag", affectedPages: 2, affectedEstimatedClicks: 95, severity: "MITTEL", recommendation: "Add unique H1 tags to /products/accessories and /sale. Current pages use H2 as the primary heading." },
    { issueType: "Duplicate title tags", affectedPages: 4, affectedEstimatedClicks: 210, severity: "MITTEL", recommendation: "4 product category pages share the same title pattern. Differentiate with specific category names and keyword targets." },
  ],

  weeklyActionRows: [
    {
      id: "wa-1",
      rank: 1,
      area: "technical",
      title: "Resolve the broken internal links on 3 traffic-carrying pages",
      whyNow: "This affects 3 pages that already bring in traffic, so fixing it protects existing visits before they slip further.",
      recommendationClass: "protect",
      primaryMetric: "crawl_health",
      expectedDirection: "recover",
      successWindow: "0-7d",
      successSignal: "Affected pages validate cleanly with no broken internal-link issue on the next crawl.",
      timeToValue: "days",
      firstVisibleWin: "The issue should clear on the next validation crawl.",
      valueAtStake: { clicksAtRisk: 180, trafficExposure: 180 },
      confidenceLabel: "high",
      confidenceScore: 0.92,
      confidenceBasis: "Three affected pages and the exposed traffic are directly measurable.",
      owner: "developer",
      effort: "S",
      priorityReason: "This is the fastest way to protect existing traffic because the issue is already confirmed and easy to validate.",
      targetPage: null,
      supportingQueries: [],
      detail: makeDetail({
        observed: ["Three internal links resolve to 404 pages on URLs that already attract traffic."],
        likelyCauses: ["A previous URL change likely left outdated destinations in navigation or content links."],
        recommendedActions: ["Create redirects for the broken destinations.", "Update the source links to the correct URLs."],
        whyThisHelps: ["It removes a direct blocker without waiting for new authority or new content to work."],
        expectedOutcome: ["The first visible win is a clean crawl and fewer broken user paths."],
        deterministic: [
          { label: "Affected pages", value: "3" },
          { label: "Estimated clicks at risk", value: "180" },
        ],
      }),
    },
    {
      id: "wa-2",
      rank: 2,
      area: "content",
      title: "Refresh the email marketing guide before writing anything new",
      whyNow: "This page already proved it can win traffic, and it is now losing a large share of that baseline.",
      recommendationClass: "protect",
      primaryMetric: "clicks",
      expectedDirection: "recover",
      successWindow: "14-42d",
      successSignal: "The target page shows a positive click trend versus the prior 28-day baseline after the refresh is indexed.",
      timeToValue: "weeks",
      firstVisibleWin: "The traffic slide should level out before clicks start climbing again.",
      valueAtStake: { clicksAtRisk: 680, recoveryPotential: 680, trafficExposure: 890 },
      confidenceLabel: "high",
      confidenceScore: 0.9,
      confidenceBasis: "The traffic drop is direct and the page already proved demand in the prior period.",
      owner: "content",
      effort: "M",
      priorityReason: "Recovering proven traffic beats starting fresh on a new article with slower and less certain upside.",
      targetPage: "/blog/email-marketing-tips",
      supportingQueries: ["email marketing tips"],
      detail: makeDetail({
        observed: ["The page fell from 890 clicks to 210 clicks.", "Traffic has been declining since its August 2025 peak."],
        likelyCauses: ["The article likely looks stale for a competitive and freshness-sensitive topic."],
        recommendedActions: ["Add a current-year update section.", "Replace outdated statistics and add new FAQ coverage."],
        whyThisHelps: ["Refreshing proven content usually yields faster recovery than publishing adjacent new pages from zero."],
        expectedOutcome: ["The page should stabilize first, then begin recovering clicks over several weeks."],
        deterministic: [
          { label: "Peak clicks", value: "890" },
          { label: "Recent clicks", value: "210" },
          { label: "Estimated clicks lost", value: "680" },
        ],
      }),
    },
    {
      id: "wa-3",
      rank: 3,
      area: "onpage",
      title: "Improve the snippet for “buy running shoes online”",
      whyNow: "This query already gets strong visibility, so a better title and description can lift clicks without waiting on rankings to move.",
      recommendationClass: "lift",
      primaryMetric: "ctr",
      expectedDirection: "improve",
      successWindow: "7-21d",
      successSignal: "CTR improves versus the prior 28-day baseline for the target query after recrawl.",
      timeToValue: "days",
      firstVisibleWin: "CTR should start moving after the page is re-crawled with the new snippet.",
      valueAtStake: { nearWinOpportunity: 572, trafficExposure: 8420 },
      confidenceLabel: "high",
      confidenceScore: 0.88,
      confidenceBasis: "The CTR gap versus the benchmark is large and impression volume is already present.",
      owner: "seo",
      effort: "XS",
      priorityReason: "This is a fast click lift, but it still comes after the work that protects traffic already slipping away.",
      targetPage: "/products/running-shoes",
      supportingQueries: ["buy running shoes online"],
      detail: makeDetail({
        observed: ["The query sits at position 5.2 with 8,420 impressions and only 2.1% CTR."],
        likelyCauses: ["The snippet likely undersells the page on a commercial query."],
        recommendedActions: ["Rewrite the title with a stronger commercial promise.", "Add snippet-worthy trust signals if the page supports them."],
        whyThisHelps: ["The page already has visibility, so CTR lift can create faster perceived wins than deeper ranking projects."],
        expectedOutcome: ["The first visible win is a CTR lift before larger click gains accumulate."],
        deterministic: [
          { label: "Impressions", value: "8,420" },
          { label: "Actual CTR", value: "2.1%" },
          { label: "Benchmark CTR", value: "8.9%" },
        ],
      }),
    },
  ],

  notRecommendedRows: [
    {
      id: "nr-1",
      area: "content",
      title: "Hold off on publishing adjacent-topic blog posts",
      recommendationClass: "expand",
      primaryMetric: "coverage",
      expectedDirection: "expand",
      successWindow: "30-90d",
      successSignal: "New pages begin earning meaningful impressions on their target topic cluster.",
      timeToValue: "months",
      firstVisibleWin: "New pages may index quickly, but they are unlikely to change this week’s results.",
      valueAtStake: { trafficExposure: 890 },
      confidenceLabel: "high",
      confidenceScore: 0.9,
      confidenceBasis: "A proven high-authority page is already decaying and should be protected first.",
      owner: "content",
      effort: "M",
      priorityReason: "Protecting and recovering proven pages is the better use of this week’s effort.",
      notRecommendedReason: "Skip net-new content until the proven page that is already losing traffic has been refreshed.",
      targetPage: null,
      supportingQueries: [],
      detail: makeDetail({
        observed: ["A proven page is already losing meaningful traffic."],
        likelyCauses: ["Expansion work would delay higher-confidence recovery work."],
        recommendedActions: ["Refresh the decaying page first, then expand into adjacent topics."],
        whyThisHelps: ["It keeps weekly effort on the most defensible business outcome."],
        expectedOutcome: ["The team avoids adding backlog while proven traffic remains exposed."],
      }),
    },
  ],

  actionBacklogRows: [
    { id: "ab-1", area: "technical", task: "Fix 3 broken internal links on /products and /blog", ownerHint: "developer", effort: "S", impactScore: 9.2, why: "Broken links lose PageRank and create poor user experience. These pages have inbound links from top-10 traffic pages.", done: false, actionDetail: makeDetail({ observed: ["Three internal links resolve to 404 destinations."], likelyCauses: ["A prior URL change likely left outdated internal links behind."], recommendedActions: ["Create redirects for the broken destinations.", "Update the source links to the correct URLs."], whyThisHelps: ["It removes crawl waste and broken user journeys immediately."], expectedOutcome: ["The blocker should disappear on the next validation crawl."], }) },
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
