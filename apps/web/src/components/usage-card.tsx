"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type UsageCardProps = {
  reportsThisMonth: number;
  reportsLimit: number | null;
  detailsThisMonth: number;
  detailsLimit: number | null;
  /** "default" = settings sidebar panel, "compact" = app sidebar */
  variant?: "default" | "compact";
};

function resetLabel() {
  const now = new Date();
  const msLeft = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / 86400000);
  return daysLeft < 1 ? `Resets in ${Math.ceil(msLeft / 3600000)}h` : `Resets in ${daysLeft}d`;
}

function Bar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function UsageCard({
  reportsThisMonth,
  reportsLimit,
  detailsThisMonth,
  detailsLimit,
  variant = "default",
}: UsageCardProps) {
  const hasAnyLimit = reportsLimit !== null || detailsLimit !== null;
  if (!hasAnyLimit) return null;

  const isCompact = variant === "compact";
  if (isCompact) return null;

  return (
    <div className={
      isCompact
        ? "rounded-lg border border-sidebar-border/70 bg-sidebar-accent/55 p-3.5 space-y-2.5"
        : "rounded-lg border border-border bg-card p-4 space-y-4"
    }>
      {reportsLimit !== null && (
        <div className={isCompact ? "space-y-1" : "space-y-2"}>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isCompact ? "text-xs text-muted-foreground" : "text-xs"}`}>
              Reports
            </span>
            <span className="text-xs text-muted-foreground">
              {reportsThisMonth} / {reportsLimit}
            </span>
          </div>
          <Bar used={reportsThisMonth} limit={reportsLimit} />
        </div>
      )}
      {detailsLimit !== null && (
        <div className={isCompact ? "space-y-1" : "space-y-2"}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className={`font-medium ${isCompact ? "text-xs text-muted-foreground" : "text-xs"}`}>
                Deep Dives
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" aria-label="About Deep Dives" />
                </TooltipTrigger>
                <TooltipContent>
                  Expand any report section for a deeper AI analysis. Use them on your highest-traffic pages first.
                </TooltipContent>
              </Tooltip>
            </span>
            <span className="text-xs text-muted-foreground">
              {detailsThisMonth} / {detailsLimit}
            </span>
          </div>
          <Bar used={detailsThisMonth} limit={detailsLimit} />
        </div>
      )}
      {!isCompact && (
        <p className="text-xs text-muted-foreground">{resetLabel()}</p>
      )}
    </div>
  );
}
