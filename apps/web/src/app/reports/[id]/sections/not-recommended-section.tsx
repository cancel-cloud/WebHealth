"use client";

import type { NotRecommendedRow } from "@webhealth/shared/lib/reports/types";
import { Badge } from "@/components/ui/badge";
import {
  formatRecommendationClassLabel,
  formatRecommendationConfidence,
  formatRecommendationEffort,
  formatRecommendationOwner,
} from "./action-surface.logic";

type NotRecommendedSectionProps = {
  rows?: NotRecommendedRow[] | null;
};

export function NotRecommendedSection({ rows }: NotRecommendedSectionProps) {
  const data = rows ?? [];
  if (!data.length) return null;

  const previewRows = data.slice(0, 3);

  return (
    <details className="rounded-lg border border-report-separator bg-report-panel/70 shadow-sm" data-report-not-recommended>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left sm:px-5">
        <div>
          <h2 className="text-base font-semibold font-display">Not Recommended This Week</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep these in the background for now. The actions above have a faster or more defensible payoff this week.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
        >
          {data.length}
        </Badge>
      </summary>

      <div className="border-t border-report-separator px-4 py-4 sm:px-5">
        <div className="space-y-3">
          {previewRows.map((row) => (
            <article
              key={row.id}
              className="rounded-lg border border-report-separator bg-report-subtle px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
                >
                  {formatRecommendationClassLabel(row.recommendationClass)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
                >
                  {formatRecommendationOwner(row.owner)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
                >
                  {formatRecommendationEffort(row.effort)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
                >
                  {formatRecommendationConfidence(row.confidenceLabel)}
                </Badge>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-foreground sm:text-base">{row.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{row.notRecommendedReason}</p>
            </article>
          ))}

          {data.length > previewRows.length ? (
            <p className="text-sm text-muted-foreground">
              {data.length - previewRows.length} more lower-priority options stay hidden here until the higher-ranked work is done.
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}
