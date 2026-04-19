import type { WeeklyReviewFinding } from "@webhealth/shared/lib/weekly-review";
import { Badge } from "@/components/ui/badge";

const FINDING_LABELS: Record<WeeklyReviewFinding["type"], string> = {
  no_impressions: "No impressions",
  impressions_without_clicks: "Impressions without clicks",
  traffic_drop: "Traffic dropped",
};

export function WeeklyReviewFindingsSection({
  findings,
}: {
  findings: WeeklyReviewFinding[];
}) {
  return (
    <section className="rounded-lg border border-border/50 bg-card p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Weekly Review Findings</h2>
          <p className="text-sm text-muted-foreground">
            Changed pages that need a quick follow-up.
          </p>
        </div>
        <Badge variant={findings.length ? "default" : "outline"}>
          {findings.length} actionable
        </Badge>
      </div>

      {findings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No changed pages crossed the automatic alert thresholds for this week.
        </p>
      ) : (
        <div className="space-y-3">
          {findings.map((finding) => (
            <div key={`${finding.type}:${finding.url}`} className="rounded-lg border border-border/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {FINDING_LABELS[finding.type]}
                  </Badge>
                  <p className="truncate font-medium">{finding.url}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{finding.message}</p>
                </div>
                <div className="grid min-w-[160px] grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
      )}
    </section>
  );
}
