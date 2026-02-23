import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? undefined,
});

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const MAX_OUTPUT_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS ?? '1200', 10);
// Rough token budget for input data — 1 token ≈ 4 chars.
const MAX_INPUT_CHARS = parseInt(process.env.OPENAI_MAX_INPUT_TOKENS ?? '8000', 10) * 4;

export type QuickWin = {
  rank: number;
  category: 'seo' | 'content' | 'technical' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  affectedPages?: string[];
};

/**
 * Trims report data to stay within the input token budget.
 * Prioritises the crawl summary and GSC totals; truncates long arrays.
 */
function trimReportData(data: Record<string, any>): Record<string, any> {
  const slim = {
    gsc: {
      current: {
        clicks: data.gsc?.current?.clicks,
        impressions: data.gsc?.current?.impressions,
        ctr: data.gsc?.current?.ctr,
        position: data.gsc?.current?.position,
        topQueries: (data.gsc?.current?.topQueries ?? []).slice(0, 10),
        topPages: (data.gsc?.current?.topPages ?? []).slice(0, 10),
      },
      compare: {
        clicks: data.gsc?.compare?.clicks,
        impressions: data.gsc?.compare?.impressions,
        ctr: data.gsc?.compare?.ctr,
        position: data.gsc?.compare?.position,
      },
    },
    ga4: {
      current: data.ga4?.current,
      compare: data.ga4?.compare,
    },
    crawl: {
      summary: data.crawl?.summary,
      // Only include pages that actually have issues to keep payload small
      issuePages: (data.crawl?.pages ?? [])
        .filter((p: any) => p.issues?.length > 0)
        .slice(0, 20)
        .map((p: any) => ({ url: p.url, issues: p.issues })),
      brokenLinks: (data.crawl?.brokenLinks ?? []).slice(0, 10),
    },
  };
  return slim;
}

export async function generateQuickWins(reportData: Record<string, any>): Promise<QuickWin[]> {
  try {
    const slim = trimReportData(reportData);
    const dataStr = JSON.stringify(slim, null, 2);

    if (dataStr.length > MAX_INPUT_CHARS) {
      console.warn(
        `[OpenAI] Input data (${dataStr.length} chars) exceeds budget of ${MAX_INPUT_CHARS} chars. Skipping AI analysis.`
      );
      return [];
    }

    const prompt = `You are an expert SEO analyst. Analyze the following website audit data and return the top 10 most impactful Quick Win action items.

Data:
${dataStr}

Return ONLY a valid JSON array (no markdown, no preamble) of objects:
[
  {
    "rank": 1,
    "category": "seo" | "content" | "technical" | "performance",
    "title": "Short action title",
    "description": "1-2 sentence explanation of the issue and how to fix it.",
    "impact": "high" | "medium" | "low",
    "affectedPages": ["https://example.com/page"]
  }
]

Rank by expected SEO impact (highest first). Be specific and actionable.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: MAX_OUTPUT_TOKENS,
    });

    const content = response.choices[0]?.message?.content ?? '[]';
    // Strip any accidental markdown fences
    const cleaned = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as QuickWin[];
  } catch (error) {
    console.error('Error generating quick wins:', error);
    return [];
  }
}
