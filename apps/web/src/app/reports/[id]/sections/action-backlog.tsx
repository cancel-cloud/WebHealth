import { Badge } from "@/components/ui/badge";
import type { ActionBacklogRow } from "@webhealth/shared/lib/reports/types";

type ActionBacklogProps = {
  rows?: ActionBacklogRow[] | null;
};

export function ActionBacklog({ rows }: ActionBacklogProps) {
  const data = rows ?? [];
  if (!data.length) return null;

  return (
    <section>
      <h2 className="text-xl font-bold font-display mb-4">What To Do This Week</h2>
      <div className="space-y-3">
        {data.slice(0, 12).map((row) => (
          <div key={row.id} className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{row.task}</p>
              <Badge variant="outline">Impact {row.impactScore.toFixed(1)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{row.why}</p>
            <div className="text-xs text-muted-foreground mt-2">
              Owner: {row.ownerHint} · Effort: {row.effort} · Area: {row.area}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
