import type { QueryIntent } from "./intent-labeler";

export type SerpSnippetRecommendation = {
  page: string;
  query: string;
  currentPosition: number;
  impressions: number;
  recommendedTitle: string;
  recommendedMeta: string;
  intentReason: string;
};

export function buildSerpSnippetRecommendations(params: {
  nearWinQueries: Array<{ keyword: string; position: number; impressions: number; targetLandingPage?: string }>;
  queryPagePairs: Array<{ query: string; page: string; impressions: number; position: number }>;
  intentClassifier: (query: string) => QueryIntent;
}): SerpSnippetRecommendation[] {
  const pageForQuery = new Map<string, string>();
  for (const pair of params.queryPagePairs) {
    if (!pageForQuery.has(pair.query)) {
      pageForQuery.set(pair.query, pair.page);
    }
  }

  return params.nearWinQueries.slice(0, 20).map((q) => {
    const page = q.targetLandingPage ?? pageForQuery.get(q.keyword) ?? "/";
    const intent = params.intentClassifier(q.keyword);

    const title =
      intent === "commercial"
        ? `${q.keyword} — Compare Options & Get the Best Deal`
        : intent === "navigational"
          ? `${q.keyword} | Official Page`
          : `${q.keyword} — Complete Guide`;

    const meta =
      intent === "commercial"
        ? `Looking for ${q.keyword}? Compare top options, read reviews, and find the best deal. Updated ${new Date().getFullYear()}.`
        : `Everything you need to know about ${q.keyword}. Expert insights, practical advice, and actionable steps.`;

    const intentReason =
      intent === "commercial"
        ? "Commercial intent: highlight value, price, or comparison signals"
        : intent === "navigational"
          ? "Navigational intent: reinforce brand authority"
          : "Informational intent: signal topical depth and expertise";

    return {
      page,
      query: q.keyword,
      currentPosition: q.position,
      impressions: q.impressions,
      recommendedTitle: title,
      recommendedMeta: meta,
      intentReason,
    };
  });
}
