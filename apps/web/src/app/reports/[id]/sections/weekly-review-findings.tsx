import type { WeeklyReviewFinding } from "@webhealth/shared/lib/weekly-review";
import { Badge } from "@/components/ui/badge";

const FINDING_LABELS: Record<WeeklyReviewFinding["type"], string> = {
  no_impressions: "No impressions yet",
  impressions_without_clicks: "Seen but not earning clicks",
  traffic_drop: "Traffic dropped",
};

export function WeeklyReviewFindingsSection({
  findings,
}: {
  findings: WeeklyReviewFinding[];
}) {
  if (!findings.length) return null;

  return (
    <section className="rounded-lg border border-report-separator bg-report-panel px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold font-display">Pages That Need A Quick Check</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            These changed pages crossed the weekly alert threshold. Review them after the ranked actions above.
          </p>
        </div>
        <Badge variant="outline" className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none">
          {findings.length} flagged
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {findings.slice(0, 3).map((finding) => (
          <div
            key={`${finding.type}:${finding.url}`}
            className="rounded-lg border border-report-separator bg-report-subtle px-4 py-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Badge
                  variant="outline"
                  className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
                >
                  {FINDING_LABELS[finding.type]}
                </Badge>
                <p className="mt-2 truncate font-medium text-foreground">{finding.url}</p>
                <p className="mt-1 text-sm text-muted-foreground">{finding.message}</p>
              </div>
              <div className="grid min-w-[170px] grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>Impressions</span>
                <span className="text-right font-medium text-foreground">
                  {finding.impressionsCompare} → {finding.impressionsCurrent}
                </span>
                <span>Clicks</span>
                <span className="text-right font-medium text-foreground">
                  {finding.clicksCompare} → {finding.clicksCurrent}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
