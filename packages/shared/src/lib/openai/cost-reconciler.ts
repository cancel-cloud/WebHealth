import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { openaiDailyCosts } from "@webhealth/shared/db/schema";

type CostsApiResponse = {
  data?: Array<{
    start_time: number;
    end_time: number;
    results?: Array<{
      amount?: { value?: number; currency?: string };
      project_id?: string | null;
      line_item?: string | null;
    }>;
  }>;
};

function toDateString(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

export async function reconcileOpenAIDailyCosts(params: {
  startTime: number;
  endTime?: number;
  projectIds?: string[];
}) {
  const adminKey = process.env.OPENAI_ADMIN_KEY;
  if (!adminKey) throw new Error("OPENAI_ADMIN_KEY is required for cost reconciliation");

  const url = new URL("https://api.openai.com/v1/organization/costs");
  url.searchParams.set("start_time", String(params.startTime));
  if (params.endTime) url.searchParams.set("end_time", String(params.endTime));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", "180");
  if (params.projectIds?.length) {
    for (const id of params.projectIds) url.searchParams.append("project_ids", id);
    url.searchParams.append("group_by", "project_id");
  }
  url.searchParams.append("group_by", "line_item");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Costs API failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as CostsApiResponse;
  const inserted: Array<{ sourceDate: string; projectId: string | null; lineItem: string | null; amountUsd: number }> = [];

  for (const bucket of data.data ?? []) {
    const sourceDate = toDateString(bucket.start_time);
    for (const result of bucket.results ?? []) {
      const amountUsd = result.amount?.value ?? 0;
      const currency = result.amount?.currency ?? "usd";
      const projectId = result.project_id ?? null;
      const lineItem = result.line_item ?? null;

      await db
        .insert(openaiDailyCosts)
        .values({
          id: `oc_${nanoid(12)}`,
          sourceDate,
          projectId,
          lineItem,
          amountUsd: String(amountUsd),
          currency,
          rawBucket: bucket as unknown as Record<string, unknown>,
        })
        .onConflictDoUpdate({
          target: [openaiDailyCosts.sourceDate, openaiDailyCosts.projectId, openaiDailyCosts.lineItem],
          set: {
            amountUsd: String(amountUsd),
            currency,
            rawBucket: bucket as unknown as Record<string, unknown>,
            fetchedAt: new Date(),
          },
        });

      inserted.push({ sourceDate, projectId, lineItem, amountUsd });
    }
  }

  return inserted;
}
