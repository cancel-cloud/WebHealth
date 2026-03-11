import { Badge } from "@/components/ui/badge";
import type { TechnicalIssueRow } from "@webhealth/shared/lib/reports/types";

const severityColor: Record<string, string> = {
  KRITISCH: "text-red-700 border-red-300 bg-red-50",
  HOCH: "text-orange-600 border-orange-200 bg-orange-50",
  MITTEL: "text-amber-600 border-amber-200 bg-amber-50",
  NIEDRIG: "text-blue-600 border-blue-200 bg-blue-50",
};

type DeepDiveTechnicalProps = {
  rows?: TechnicalIssueRow[] | null;
  crawlSummary?: Record<string, number> | null;
};

export function DeepDiveTechnical({ rows, crawlSummary }: DeepDiveTechnicalProps) {
  const hasIssues = (rows?.length ?? 0) > 0;
  const hasCrawl = crawlSummary && Object.keys(crawlSummary).length > 0;

  if (!hasIssues && !hasCrawl) return null;

  return (
    <section>
      <h2 className="text-xl font-bold font-display mb-4">Technical Impact</h2>
      {hasIssues && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {(rows ?? []).slice(0, 8).map((row) => (
            <div key={row.issueType} className="p-4 rounded-lg bg-card border border-border/50 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-sm">{row.issueType}</p>
                <Badge variant="outline" className={severityColor[row.severity] ?? ""}>
                  {row.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.affectedPages} pages · est. clicks at risk: {row.affectedEstimatedClicks}
              </p>
              <p className="text-sm mt-2">{row.recommendation}</p>
            </div>
          ))}
        </div>
      )}
      {hasCrawl && (
        <div>
          <h3 className="text-base font-semibold mb-3">Crawl Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(crawlSummary!).map(([key, val]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border ${val > 0 ? "bg-red-50 dark:bg-red-950/20 border-red-200" : "bg-card border-border/50"} shadow-sm text-center`}
              >
                <p className={`text-2xl font-bold font-display ${val > 0 ? "text-red-600" : "text-green-600"}`}>
                  {val}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
