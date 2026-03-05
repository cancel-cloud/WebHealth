"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  ContentDecayRow,
  CannibalizationRow,
  NearWinKeywordRow,
  LostClickEstimateRow,
} from "@webhealth/shared/lib/reports/types";
import { GetDetailsButton } from "./get-details-button";

type Tab = "ctrGaps" | "nearWin" | "contentDecay" | "cannibalization";

type QuickWinsGridProps = {
  reportId: string;
  ctrGaps?: LostClickEstimateRow[] | null;
  nearWinKeywords?: NearWinKeywordRow[] | null;
  contentDecay?: ContentDecayRow[] | null;
  cannibalization?: CannibalizationRow[] | null;
};

const severityColor: Record<string, string> = {
  KRITISCH: "text-red-700 border-red-300 bg-red-50",
  HOCH: "text-orange-600 border-orange-200 bg-orange-50",
  MITTEL: "text-amber-600 border-amber-200 bg-amber-50",
  NIEDRIG: "text-blue-600 border-blue-200 bg-blue-50",
};

export function QuickWinsGrid({ reportId, ctrGaps, nearWinKeywords, contentDecay, cannibalization }: QuickWinsGridProps) {
  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "ctrGaps", label: "CTR Gaps", count: ctrGaps?.length ?? 0 },
    { id: "nearWin", label: "Near-Win Keywords", count: nearWinKeywords?.length ?? 0 },
    { id: "contentDecay", label: "Content Decay", count: contentDecay?.length ?? 0 },
    { id: "cannibalization", label: "Cannibalization", count: cannibalization?.length ?? 0 },
  ];

  const defaultTab = tabs.find((t) => t.count > 0)?.id ?? "ctrGaps";
  const [active, setActive] = useState<Tab>(defaultTab);

  return (
    <div className="rounded-3xl bg-card border border-border/50 shadow-sm overflow-hidden">
      <div className="border-b border-border/50 flex gap-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              active === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs bg-muted rounded-full px-1.5 py-0.5">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {active === "ctrGaps" && (
          <CtrGapsTab reportId={reportId} rows={ctrGaps ?? []} />
        )}
        {active === "nearWin" && (
          <NearWinTab reportId={reportId} rows={nearWinKeywords ?? []} />
        )}
        {active === "contentDecay" && (
          <ContentDecayTab reportId={reportId} rows={contentDecay ?? []} />
        )}
        {active === "cannibalization" && (
          <CannibalizationTab reportId={reportId} rows={cannibalization ?? []} />
        )}
      </div>
    </div>
  );
}

function CtrGapsTab({ reportId, rows }: { reportId: string; rows: LostClickEstimateRow[] }) {
  if (!rows.length) return <EmptyState message="No CTR gap data available." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Query</th>
            <th className="py-2 pr-4 font-medium">Impressions</th>
            <th className="py-2 pr-4 font-medium">Actual CTR</th>
            <th className="py-2 pr-4 font-medium">Benchmark CTR</th>
            <th className="py-2 pr-4 font-medium">Est. Lost Clicks</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((row) => (
            <tr key={row.query} className="border-t border-border/30">
              <td className="py-2 pr-4 font-medium max-w-[250px] truncate">{row.query}</td>
              <td className="py-2 pr-4">{row.impressions.toLocaleString()}</td>
              <td className="py-2 pr-4">{(row.actualCtr * 100).toFixed(2)}%</td>
              <td className="py-2 pr-4">{(row.benchmarkCtr * 100).toFixed(2)}%</td>
              <td className="py-2 pr-4 text-red-600 font-medium">{row.estimatedLostClicks.toFixed(0)}</td>
              <td className="py-2">
                <GetDetailsButton
                  reportId={reportId}
                  rowType="ctrGap"
                  rowId={row.query}
                  rowTitle={row.query}
                  initialDetail={row.actionDetail}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NearWinTab({ reportId, rows }: { reportId: string; rows: NearWinKeywordRow[] }) {
  if (!rows.length) return <EmptyState message="No near-win keywords found." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Keyword</th>
            <th className="py-2 pr-4 font-medium">Position</th>
            <th className="py-2 pr-4 font-medium">Impressions</th>
            <th className="py-2 pr-4 font-medium">Clicks</th>
            <th className="py-2 pr-4 font-medium">CTR</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((row) => (
            <tr key={row.keyword} className="border-t border-border/30">
              <td className="py-2 pr-4 font-medium max-w-[250px] truncate">{row.keyword}</td>
              <td className="py-2 pr-4">{row.position.toFixed(1)}</td>
              <td className="py-2 pr-4">{row.impressions.toLocaleString()}</td>
              <td className="py-2 pr-4">{row.clicks.toLocaleString()}</td>
              <td className="py-2 pr-4">{(row.ctr * 100).toFixed(2)}%</td>
              <td className="py-2">
                <GetDetailsButton
                  reportId={reportId}
                  rowType="nearWin"
                  rowId={row.keyword}
                  rowTitle={row.keyword}
                  initialDetail={row.actionDetail}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentDecayTab({ reportId, rows }: { reportId: string; rows: ContentDecayRow[] }) {
  if (!rows.length) return <EmptyState message="No content decay detected — your pages are holding up well." />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((row) => (
        <div key={row.page} className="p-3 rounded-2xl bg-muted/30 border border-border/30">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium truncate max-w-[400px]">{row.page}</p>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={severityColor[row.severity] ?? ""}>
                {row.severity}
              </Badge>
              <GetDetailsButton
                reportId={reportId}
                rowType="contentDecay"
                rowId={row.page}
                rowTitle={row.page}
                initialDetail={row.actionDetail}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Peak: {row.peakClicks.toLocaleString()} clicks</span>
            <span>Recent: {row.recentClicks.toLocaleString()} clicks</span>
            <span className="text-red-600 font-medium">
              −{row.estimatedLostClicks.toLocaleString()} ({((1 - row.decayRatio) * 100).toFixed(0)}% drop)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CannibalizationTab({ reportId, rows }: { reportId: string; rows: CannibalizationRow[] }) {
  if (!rows.length) return <EmptyState message="No keyword cannibalization detected." />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((row) => (
        <div key={row.query} className="p-3 rounded-2xl bg-muted/30 border border-border/30">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium">&ldquo;{row.query}&rdquo;</p>
            <GetDetailsButton
              reportId={reportId}
              rowType="cannibalization"
              rowId={row.query}
              rowTitle={row.query}
              initialDetail={row.actionDetail}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{row.totalClicks.toLocaleString()} total clicks</span>
            <span>{row.totalImpressions.toLocaleString()} impressions</span>
            <span>{row.pages.length} competing pages</span>
          </div>
          <ul className="text-xs space-y-0.5">
            {row.pages.slice(0, 4).map((p) => (
              <li key={p} className="text-muted-foreground truncate">{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">{message}</div>
  );
}
