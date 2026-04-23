import { Badge } from "@/components/ui/badge";
import type { AlertsAndFlags } from "@webhealth/shared/lib/reports/types";

type ExecutiveSummaryProps = {
  executiveSummary: {
    headline: string;
    topActionAreas: string[];
  } | null | undefined;
  alertsAndFlags?: AlertsAndFlags | null;
};

export function ExecutiveSummary({ executiveSummary, alertsAndFlags }: ExecutiveSummaryProps) {
  if (!executiveSummary) return null;

  return (
    <section className="rounded-lg border border-report-separator bg-report-panel px-5 py-5 shadow-sm">
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold font-display">Why These Actions Rose To The Top</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Use this as supporting context after you scan the ranked action list.
          </p>
        </div>

        <p className="max-w-4xl text-sm leading-6 text-foreground/88 sm:text-base">
          {executiveSummary.headline}
        </p>

        {executiveSummary.topActionAreas.length > 0 ? (
          <ul className="grid gap-2 text-sm text-foreground/88 md:grid-cols-2">
            {executiveSummary.topActionAreas.slice(0, 4).map((area, index) => (
              <li key={area} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-report-subtle text-[11px] font-semibold text-foreground">
                  {index + 1}
                </span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {alertsAndFlags ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {alertsAndFlags.criticalTechnicalIssues > 0 ? (
              <Badge variant="outline" className="border-red-300/70 bg-red-500/8 text-red-700 dark:text-red-200">
                {alertsAndFlags.criticalTechnicalIssues} critical technical issue{alertsAndFlags.criticalTechnicalIssues === 1 ? "" : "s"}
              </Badge>
            ) : null}
            {alertsAndFlags.contentDecayDetected ? (
              <Badge variant="outline" className="border-amber-300/70 bg-amber-500/8 text-amber-700 dark:text-amber-200">
                Content decay detected
              </Badge>
            ) : null}
            {alertsAndFlags.significantLosers.length > 0 ? (
              <Badge variant="outline" className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none">
                {alertsAndFlags.significantLosers.length} pages losing traffic
              </Badge>
            ) : null}
            {alertsAndFlags.cannibalizationCount > 0 ? (
              <Badge variant="outline" className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none">
                {alertsAndFlags.cannibalizationCount} overlap issue{alertsAndFlags.cannibalizationCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
