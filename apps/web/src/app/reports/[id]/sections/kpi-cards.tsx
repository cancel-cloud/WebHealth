"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { KpiTrendRow } from "@webhealth/shared/lib/reports/types";

type GscMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type KpiCardsProps = {
  gscCurrent: GscMetrics;
  gscCompare: GscMetrics;
  ga4Current: { sessions: number; users: number } | null;
  ga4Compare: { sessions: number; users: number } | null;
  kpiTrendRows?: KpiTrendRow[];
};

function Delta({
  current,
  compare,
  format = "number",
}: {
  current: number;
  compare: number;
  format?: "number" | "percent" | "position";
}) {
  const delta = current - compare;
  const pct = compare !== 0 ? ((delta / compare) * 100).toFixed(1) : "∞";
  const isPositive = format === "position" ? delta < 0 : delta > 0;
  const color = isPositive ? "text-green-500" : delta === 0 ? "text-muted-foreground" : "text-red-500";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}
      {format === "percent"
        ? `${(delta * 100).toFixed(2)}%`
        : format === "position"
          ? delta.toFixed(1)
          : delta.toLocaleString()}{" "}
      ({pct}%)
    </span>
  );
}

function Sparkline({
  data,
  dataKey,
  color,
}: {
  data: Record<string, number>[];
  dataKey: string;
  color: string;
}) {
  if (!data.length) return <div className="h-[60px] text-xs text-muted-foreground flex items-center">No trend</div>;
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={`url(#grad-${dataKey})`}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KpiCards({ gscCurrent, gscCompare, ga4Current, ga4Compare, kpiTrendRows }: KpiCardsProps) {
  const trendData = kpiTrendRows ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Clicks",
            curr: gscCurrent.clicks,
            comp: gscCompare.clicks,
            fmt: "number" as const,
            sparkKey: "clicksCurrent",
            color: "#2563eb",
          },
          {
            label: "Impressions",
            curr: gscCurrent.impressions,
            comp: gscCompare.impressions,
            fmt: "number" as const,
            sparkKey: "impressionsCurrent",
            color: "#16a34a",
          },
          {
            label: "CTR",
            curr: gscCurrent.ctr,
            comp: gscCompare.ctr,
            fmt: "percent" as const,
            sparkKey: "ctrCurrent",
            color: "#0891b2",
          },
          {
            label: "Avg Position",
            curr: gscCurrent.position,
            comp: gscCompare.position,
            fmt: "position" as const,
            sparkKey: "positionCurrent",
            color: "#9333ea",
          },
        ].map(({ label, curr, comp, fmt, sparkKey, color }) => (
          <div key={label} className="p-4 rounded-lg bg-card border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold font-display mb-1">
              {fmt === "percent"
                ? `${(curr * 100).toFixed(2)}%`
                : fmt === "position"
                  ? curr.toFixed(1)
                  : curr.toLocaleString()}
            </p>
            <Delta current={curr} compare={comp} format={fmt} />
            {trendData.length > 1 && (
              <div className="mt-2">
                <Sparkline data={trendData as unknown as Record<string, number>[]} dataKey={sparkKey} color={color} />
              </div>
            )}
          </div>
        ))}
      </div>

      {ga4Current && (
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="p-4 rounded-lg bg-card border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Sessions</p>
            <p className="text-2xl font-bold font-display mb-1">{ga4Current.sessions.toLocaleString()}</p>
            {ga4Compare && <Delta current={ga4Current.sessions} compare={ga4Compare.sessions} />}
          </div>
          <div className="p-4 rounded-lg bg-card border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Users</p>
            <p className="text-2xl font-bold font-display mb-1">{ga4Current.users.toLocaleString()}</p>
            {ga4Compare && <Delta current={ga4Current.users} compare={ga4Compare.users} />}
          </div>
        </div>
      )}
    </div>
  );
}
