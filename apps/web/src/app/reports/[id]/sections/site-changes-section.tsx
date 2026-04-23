import type { SiteChanges } from "@webhealth/shared/lib/reports/types";

type SiteChangesSectionProps = {
  siteChanges?: SiteChanges | null;
};

export function SiteChangesSection({ siteChanges }: SiteChangesSectionProps) {
  const hasChanges =
    (siteChanges?.newPages?.length ?? 0) > 0 ||
    (siteChanges?.changedPages?.length ?? 0) > 0 ||
    (siteChanges?.removedPages?.length ?? 0) > 0;

  if (!hasChanges) return null;

  return (
    <details className="overflow-hidden rounded-lg border border-report-separator bg-report-panel shadow-sm">
      <summary className="px-6 py-4 cursor-pointer text-base font-semibold font-display select-none">
        Site Changes
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({(siteChanges?.newPages?.length ?? 0)} new · {siteChanges?.changedPages?.length ?? 0} changed · {siteChanges?.removedPages?.length ?? 0} removed)
        </span>
      </summary>
      <div className="px-6 pb-6 space-y-4">
        {[
          { label: "New Pages", entries: siteChanges?.newPages ?? [] },
          { label: "Changed Pages", entries: siteChanges?.changedPages ?? [] },
          { label: "Removed Pages", entries: siteChanges?.removedPages ?? [] },
        ]
          .filter((g) => g.entries.length > 0)
          .map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{group.label}</h3>
              <ul className="space-y-1">
                {group.entries.slice(0, 10).map((entry) => (
                  <li key={entry.url} className="text-sm">
                    <span className="font-mono text-xs">{entry.url}</span>
                    {entry.machineDiffSummary && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.machineDiffSummary}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </details>
  );
}
