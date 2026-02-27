import OpenAI from 'openai';
import { makeClientRequestId } from '@/lib/openai/request-tracing';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? undefined,
  organization: process.env.OPENAI_ORG ?? undefined,
  project: process.env.OPENAI_PROJECT ?? undefined,
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

export type QuickWinsResult = {
  quickWins: QuickWin[];
  usage?: Record<string, unknown> | null;
  xRequestId?: string | null;
  xClientRequestId?: string | null;
};

type CrawlIssuePage = {
  url?: string;
  issues?: unknown;
};

/**
 * Trims report data to stay within the input token budget.
 * Prioritises the crawl summary and GSC totals; truncates long arrays.
 */
function trimReportData(data: Record<string, unknown>): Record<string, unknown> {
  const source = data as {
    gsc?: {
      current?: {
        clicks?: unknown;
        impressions?: unknown;
        ctr?: unknown;
        position?: unknown;
        topQueries?: unknown[];
        topPages?: unknown[];
      };
      compare?: {
        clicks?: unknown;
        impressions?: unknown;
        ctr?: unknown;
        position?: unknown;
      };
    };
    ga4?: {
      current?: unknown;
      compare?: unknown;
    };
    crawl?: {
      summary?: unknown;
      pages?: CrawlIssuePage[];
      brokenLinks?: unknown[];
    };
  };

  const slim = {
    gsc: {
      current: {
        clicks: source.gsc?.current?.clicks,
        impressions: source.gsc?.current?.impressions,
        ctr: source.gsc?.current?.ctr,
        position: source.gsc?.current?.position,
        topQueries: (source.gsc?.current?.topQueries ?? []).slice(0, 10),
        topPages: (source.gsc?.current?.topPages ?? []).slice(0, 10),
      },
      compare: {
        clicks: source.gsc?.compare?.clicks,
        impressions: source.gsc?.compare?.impressions,
        ctr: source.gsc?.compare?.ctr,
        position: source.gsc?.compare?.position,
      },
    },
    ga4: {
      current: source.ga4?.current,
      compare: source.ga4?.compare,
    },
    crawl: {
      summary: source.crawl?.summary,
      // Only include pages that actually have issues to keep payload small
      issuePages: (source.crawl?.pages ?? [])
        .filter((p) => Array.isArray(p.issues) && p.issues.length > 0)
        .slice(0, 20)
        .map((p) => ({ url: p.url, issues: p.issues })),
      brokenLinks: (source.crawl?.brokenLinks ?? []).slice(0, 10),
    },
  };
  return slim;
}

export async function generateQuickWinsWithMeta(
  reportData: Record<string, unknown>,
  options?: { reportId?: string; jobId?: string; phase?: string }
): Promise<QuickWinsResult> {
  try {
    const slim = trimReportData(reportData);
    const dataStr = JSON.stringify(slim, null, 2);

    if (dataStr.length > MAX_INPUT_CHARS) {
      console.warn(
        `[OpenAI] Input data (${dataStr.length} chars) exceeds budget of ${MAX_INPUT_CHARS} chars. Skipping AI analysis.`
      );
      return { quickWins: [] };
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

    const xClientRequestId =
      options?.reportId && options?.jobId
        ? makeClientRequestId({
            reportId: options.reportId,
            jobId: options.jobId,
            phase: options.phase ?? 'quick_wins',
          })
        : null;

    const response = await client.chat.completions.create(
      {
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: MAX_OUTPUT_TOKENS,
      },
      xClientRequestId ? { headers: { 'X-Client-Request-Id': xClientRequestId } } : undefined
    );

    const content = response.choices[0]?.message?.content ?? '[]';
    // Strip any accidental markdown fences
    const cleaned = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    return {
      quickWins: JSON.parse(cleaned) as QuickWin[],
      usage: (response as unknown as { usage?: Record<string, unknown> }).usage ?? null,
      xRequestId:
        (response as unknown as { _request_id?: string })._request_id ?? null,
      xClientRequestId,
    };
  } catch (error) {
    console.error('Error generating quick wins:', error);
    return { quickWins: [] };
  }
}

export async function generateQuickWins(reportData: Record<string, unknown>): Promise<QuickWin[]> {
  const result = await generateQuickWinsWithMeta(reportData);
  return result.quickWins;
}
