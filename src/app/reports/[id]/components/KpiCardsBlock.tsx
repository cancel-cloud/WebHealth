import type { KpiCardsBlock } from "@/lib/reports/dashboard-blocks";

export function KpiCardsBlock({ block }: { block: KpiCardsBlock }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {block.rows.map((row) => (
        <div
          key={row.metric}
          className="rounded-lg border bg-card p-4 flex flex-col gap-1"
        >
          <p className="text-xs text-muted-foreground font-medium truncate">{row.metric}</p>
          <p className="text-xl font-bold">{row.current}</p>
          <p className="text-xs">
            <span className="text-muted-foreground">vs </span>
            <span>{row.previous}</span>
            <span
              className={`ml-1 font-medium ${
                row.assessment === "Positive" ? "text-green-600" : "text-red-500"
              }`}
            >
              ({row.delta})
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
