"use client";

import type { RecommendationDetail } from "@webhealth/shared/lib/reports/types";
import { sanitizeActionDetailPayload } from "@webhealth/shared/lib/action-detail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionDetailModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  detail: RecommendationDetail | null;
};

function DetailList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-1.5 text-foreground/80">
      {items.map((item) => (
        <li key={item} className="leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ActionDetailModal({ open, onClose, title, detail }: ActionDetailModalProps) {
  const parsed = detail ? sanitizeActionDetailPayload(detail) : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{title}</DialogTitle>
        </DialogHeader>

        {!parsed && (
          <p className="text-sm text-muted-foreground">No details available.</p>
        )}

        {parsed && (
          <div className="space-y-5 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold">Observed</h3>
              <DetailList items={parsed.observed} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Likely Cause</h3>
              <DetailList items={parsed.likelyCauses} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Recommended Action</h3>
              <DetailList items={parsed.recommendedActions} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Why This Helps</h3>
              <DetailList items={parsed.whyThisHelps} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Expected Outcome</h3>
              <DetailList items={parsed.expectedOutcome} />
            </section>

            {(parsed.evidence.deterministic.length > 0 || parsed.evidence.inferred.length > 0) && (
              <section className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="font-semibold">Why This Was Flagged</h3>

                {parsed.evidence.deterministic.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Deterministic Evidence
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {parsed.evidence.deterministic.map((item) => (
                        <div
                          key={`${item.label}:${item.value}`}
                          className="rounded-lg border border-border/40 bg-background px-3 py-2"
                        >
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.evidence.inferred.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Inferred Support
                    </p>
                    <DetailList items={parsed.evidence.inferred} />
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
