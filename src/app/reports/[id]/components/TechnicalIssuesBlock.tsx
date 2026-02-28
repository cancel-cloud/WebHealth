import type { TechnicalIssuesBlock } from "@/lib/reports/dashboard-blocks";

const severityColors: Record<string, string> = {
  KRITISCH: "text-red-600 bg-red-50 border-red-200",
  HOCH: "text-orange-600 bg-orange-50 border-orange-200",
  MITTEL: "text-amber-600 bg-amber-50 border-amber-200",
  NIEDRIG: "text-green-700 bg-green-50 border-green-200",
};

export function TechnicalIssuesBlock({ block }: { block: TechnicalIssuesBlock }) {
  return (
    <div className="space-y-2">
      {block.rows.map((row) => (
        <div key={row.issueType} className={`rounded-lg border p-3 ${severityColors[row.severity] ?? ""}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-sm">{row.issueType}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${severityColors[row.severity] ?? ""}`}>
              {row.severity}
            </span>
          </div>
          <p className="text-xs">{row.affectedPages} pages affected · est. {row.affectedEstimatedClicks} clicks at risk</p>
          <p className="text-xs mt-1 opacity-80">{row.recommendation}</p>
        </div>
      ))}
    </div>
  );
}
