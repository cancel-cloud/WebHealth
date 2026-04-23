import { Badge } from "@/components/ui/badge";

type JobEvent = {
  id: string;
  level: string | null;
  phase: string | null;
  message: string | null;
  createdAt: Date | string;
};

type JobTimelineProps = {
  events: JobEvent[];
};

export function JobTimeline({ events }: JobTimelineProps) {
  if (!events.length) return null;

  return (
    <details className="overflow-hidden rounded-lg border border-report-separator bg-report-panel shadow-sm">
      <summary className="px-6 py-4 cursor-pointer text-base font-semibold font-display select-none">
        Job Timeline
        <span className="ml-2 text-sm font-normal text-muted-foreground">({events.length} events)</span>
      </summary>
      <div className="px-6 pb-6 space-y-2">
        {events.map((e) => (
          <div key={e.id} className="rounded-lg border border-report-separator bg-report-subtle p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge
                variant="outline"
                className={
                  e.level === "error"
                    ? "text-red-600 border-red-200"
                    : e.level === "warn"
                      ? "text-amber-600 border-amber-200"
                      : "text-blue-600 border-blue-200"
                }
              >
                {e.level}
              </Badge>
              {e.phase && <span className="font-medium">{e.phase}</span>}
              <span className="text-muted-foreground text-xs">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
            {e.message && <p className="mt-1 text-sm">{e.message}</p>}
          </div>
        ))}
      </div>
    </details>
  );
}
