import type { ContentGapsBlock } from "@/lib/reports/dashboard-blocks";

const gapTypeLabels: Record<string, string> = { A: "Missing Page", B: "Wrong Page", C: "Content Gap" };
const intentColors: Record<string, string> = {
  informational: "text-blue-600",
  commercial: "text-purple-600",
  navigational: "text-gray-600",
};

export function ContentGapsBlock({ block }: { block: ContentGapsBlock }) {
  return (
    <div className="space-y-3">
      {block.warnings?.map((w) => (
        <div key={w} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {w}
        </div>
      ))}
      {block.rows.map((row, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
              Type {row.gapType} — {gapTypeLabels[row.gapType]}
            </span>
            <span className={`text-xs font-medium ${intentColors[row.intent] ?? ""}`}>{row.intent}</span>
            <span className="text-xs text-muted-foreground ml-auto">score {row.priorityScore}</span>
          </div>
          <p className="font-medium text-sm">&quot;{row.query}&quot;</p>
          <p className="text-xs text-muted-foreground">
            {row.evidenceMetrics.impressions.toLocaleString()} impr · pos {row.evidenceMetrics.position.toFixed(1)} · CTR {(row.evidenceMetrics.ctr * 100).toFixed(2)}%
            {row.evidenceMetrics.engagementRate != null && ` · eng ${(row.evidenceMetrics.engagementRate * 100).toFixed(1)}%`}
          </p>
          {row.primaryPage && (
            <p className="text-xs text-muted-foreground truncate">Page: {row.primaryPage}</p>
          )}
          <p className="text-xs mt-1 border-t pt-1">{row.suggestedAction}</p>
        </div>
      ))}
    </div>
  );
}
