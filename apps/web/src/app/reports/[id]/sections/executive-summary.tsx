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
    <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
      <h2 className="text-xl font-bold font-display mb-2">Executive Summary</h2>
      <p className="text-lg font-medium mb-4">{executiveSummary.headline}</p>

      {executiveSummary.topActionAreas.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2 font-medium">Top Action Areas</p>
          <ul className="space-y-1">
            {executiveSummary.topActionAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {alertsAndFlags && (
        <div className="flex flex-wrap gap-2 mt-3">
          {alertsAndFlags.contentDecayDetected && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              Content Decay Detected
            </Badge>
          )}
          {alertsAndFlags.significantLosers.length > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
              {alertsAndFlags.significantLosers.length} Significant Losers
            </Badge>
          )}
          {alertsAndFlags.cannibalizationCount > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              {alertsAndFlags.cannibalizationCount} Cannibalization Issues
            </Badge>
          )}
          {alertsAndFlags.criticalTechnicalIssues > 0 && (
            <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
              {alertsAndFlags.criticalTechnicalIssues} Critical Technical Issues
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
