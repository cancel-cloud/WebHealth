"use client";
import { useState } from "react";
import type { TableBlock, DrilldownPayload } from "@/lib/reports/dashboard-blocks";

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") {
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(2);
  }
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

// Determine the drilldown type for a table block (used for the overflow API call)
function getDrilldownType(blockId: string): "query" | "page" | null {
  if (blockId === "query_opportunities" || blockId === "near_win_keywords") return "query";
  if (blockId === "page_winners_losers") return "page";
  return null;
}

export function TableBlock({
  block,
  reportId,
}: {
  block: TableBlock;
  reportId?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadedDetails, setLoadedDetails] = useState<Record<string, DrilldownPayload>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const drilldownType = getDrilldownType(block.id);

  async function loadDetail(rowKey: string) {
    if (!reportId || !drilldownType || loading === rowKey) return;
    setLoading(rowKey);
    try {
      const res = await fetch(
        `/api/reports/${reportId}/drilldown?type=${drilldownType}&key=${encodeURIComponent(rowKey)}`
      );
      if (res.ok) {
        const data = (await res.json()) as DrilldownPayload;
        setLoadedDetails((prev) => ({ ...prev, [rowKey]: data }));
        setExpanded(rowKey);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {block.columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
              >
                {col}
              </th>
            ))}
            {drilldownType && <th className="px-3 py-2 w-8" />}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => {
            const rowKey = String(row[block.columns[0]] ?? i);
            const inlineDetail = block.details?.[rowKey];
            const loadedDetail = loadedDetails[rowKey];
            const drilldown = inlineDetail ?? loadedDetail;
            const isExpanded = expanded === rowKey;
            const hasInline = !!inlineDetail;
            const isLoading = loading === rowKey;

            return (
              <>
                <tr
                  key={rowKey}
                  className={`border-b hover:bg-muted/20 ${drilldown ? "cursor-pointer" : ""}`}
                  onClick={() => drilldown && setExpanded(isExpanded ? null : rowKey)}
                >
                  {block.columns.map((col) => (
                    <td key={col} className="px-3 py-2 max-w-[240px] truncate">
                      {formatValue(row[col])}
                    </td>
                  ))}
                  {drilldownType && (
                    <td className="px-3 py-2 text-right">
                      {hasInline ? (
                        <span className="text-xs text-muted-foreground select-none">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      ) : !drilldown ? (
                        <button
                          className="text-xs text-primary hover:underline disabled:opacity-50"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            void loadDetail(rowKey);
                          }}
                        >
                          {isLoading ? "…" : "details"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground select-none">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
                {isExpanded && drilldown && (
                  <tr key={`${rowKey}-detail`} className="bg-muted/10">
                    <td
                      colSpan={block.columns.length + (drilldownType ? 1 : 0)}
                      className="px-4 py-3"
                    >
                      <DrilldownPanel payload={drilldown} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DrilldownPanel({ payload }: { payload: DrilldownPayload }) {
  if (payload.type === "query") {
    return (
      <div className="text-xs space-y-2">
        <p className="font-semibold">Top Pages for &quot;{payload.query}&quot;</p>
        <div className="space-y-1">
          {payload.topPages.map((p) => (
            <div key={p.page} className="flex gap-4 items-center">
              <span className="truncate max-w-[300px] text-muted-foreground">{p.page}</span>
              <span>pos {p.position.toFixed(1)}</span>
              <span>{p.clicks} clicks</span>
              <span>{p.impressions} impr</span>
            </div>
          ))}
        </div>
        {(payload.deviceSplit.length > 0 || payload.countrySplit.length > 0) && (
          <div className="flex gap-6 pt-1 border-t text-muted-foreground">
            {payload.deviceSplit.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Devices: </span>
                {payload.deviceSplit.map((d) => d.device).join(", ")}
              </div>
            )}
            {payload.countrySplit.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Countries: </span>
                {payload.countrySplit.map((c) => c.country).join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  if (payload.type === "page") {
    return (
      <div className="text-xs space-y-2">
        <p className="font-semibold">Top Queries for {payload.page}</p>
        <div className="space-y-1">
          {payload.topQueries.map((q) => (
            <div key={q.query} className="flex gap-4 items-center">
              <span className="truncate max-w-[300px]">{q.query}</span>
              <span className="text-muted-foreground">{q.intent}</span>
              <span>pos {q.position.toFixed(1)}</span>
              <span>{q.clicks} clicks</span>
            </div>
          ))}
        </div>
        {payload.ga4Organic && (
          <div className="flex gap-4 pt-1 border-t">
            <span>Sessions: {payload.ga4Organic.sessions}</span>
            <span>Engagement: {(payload.ga4Organic.engagementRate * 100).toFixed(1)}%</span>
            <span>Bounce: {(payload.ga4Organic.bounceRate * 100).toFixed(1)}%</span>
          </div>
        )}
        {(payload.crawlFlags.missingTitle ||
          payload.crawlFlags.missingMeta ||
          payload.crawlFlags.multipleH1 ||
          payload.crawlFlags.canonicalIssue) && (
          <div className="pt-1 border-t text-amber-600">
            Crawl flags:{" "}
            {[
              payload.crawlFlags.missingTitle && "missing title",
              payload.crawlFlags.missingMeta && "missing meta",
              payload.crawlFlags.multipleH1 && "multiple H1",
              payload.crawlFlags.canonicalIssue && "canonical issue",
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}
      </div>
    );
  }
  return null;
}
