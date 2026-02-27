import type { ActionBacklogBlock } from "@/lib/reports/dashboard-blocks";

const areaColors: Record<string, string> = {
  technical: "bg-red-100 text-red-700",
  content: "bg-blue-100 text-blue-700",
  onpage: "bg-amber-100 text-amber-700",
  analytics: "bg-purple-100 text-purple-700",
};

export function ActionBacklogBlock({ block }: { block: ActionBacklogBlock }) {
  return (
    <div className="space-y-2">
      {block.rows.map((row) => (
        <div key={row.id} className="rounded-lg border p-3 flex gap-3 items-start">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${areaColors[row.area] ?? "bg-gray-100 text-gray-700"}`}>
                {row.area}
              </span>
              <span className="text-xs text-muted-foreground">{row.ownerHint} · {row.effort}</span>
            </div>
            <p className="text-sm font-medium">{row.task}</p>
            <p className="text-xs text-muted-foreground">{row.why}</p>
          </div>
          <div className="text-right text-xs shrink-0">
            <p className="font-bold text-base">{Math.round(row.impactScore)}</p>
            <p className="text-muted-foreground">impact</p>
          </div>
        </div>
      ))}
    </div>
  );
}
