"use client";

import { useMemo, useState } from "react";
import { EchartsChart } from "@/components/echarts-chart";

type TrendPoint = {
  date: string;
  clicks: number;
  impressions: number;
  sessions?: number | null;
  users?: number | null;
};

type TrendMetric = "clicks" | "impressions" | "sessions" | "users";

const METRICS: Array<{ value: TrendMetric; label: string; color: string; axis: 0 | 1 }> = [
  { value: "clicks", label: "Clicks", color: "#6366f1", axis: 0 },
  { value: "impressions", label: "Impressions", color: "#0ea5e9", axis: 1 },
  { value: "sessions", label: "Sessions", color: "#10b981", axis: 0 },
  { value: "users", label: "Users", color: "#fb923c", axis: 0 },
];

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function PropertyShareTrendChart({
  trend,
  primary,
  accent,
}: {
  trend: TrendPoint[];
  primary: string;
  accent: string;
}) {
  const availableMetrics = useMemo(() => {
    return METRICS.filter((metric) => trend.some((point) => point[metric.value] != null));
  }, [trend]);
  const [selectedMetrics, setSelectedMetrics] = useState<TrendMetric[]>(() =>
    availableMetrics.slice(0, 4).map((metric) => metric.value),
  );

  const activeMetrics = availableMetrics.filter((metric) => selectedMetrics.includes(metric.value));
  const labels = trend.map((point) => formatDateLabel(point.date));

  function toggleMetric(metric: TrendMetric) {
    setSelectedMetrics((current) => {
      if (current.includes(metric)) {
        return current.length > 1 ? current.filter((item) => item !== metric) : current;
      }
      return [...current, metric];
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Traffic trend</h2>
          <p className="mt-1 text-sm text-slate-500">How traffic moved through the report period.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map((metric) => (
            <button
              key={metric.value}
              type="button"
              onClick={() => toggleMetric(metric.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                selectedMetrics.includes(metric.value)
                  ? "border-transparent text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
              style={selectedMetrics.includes(metric.value) ? { backgroundColor: metric.value === "clicks" ? primary : metric.value === "impressions" ? accent : metric.color } : undefined}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[320px]">
        {trend.length && activeMetrics.length ? (
          <EchartsChart
            option={{
              grid: { left: 44, right: activeMetrics.some((metric) => metric.axis === 1) ? 56 : 20, top: 18, bottom: 34 },
              xAxis: {
                type: "category",
                data: labels,
                boundaryGap: false,
                axisLine: { lineStyle: { color: "#cbd5e1" } },
                axisTick: { show: false },
                axisLabel: { color: "#64748b", fontSize: 11, interval: Math.max(0, Math.floor(labels.length / 7)) },
              },
              yAxis: [
                {
                  type: "value",
                  minInterval: 1,
                  axisLine: { show: false },
                  axisTick: { show: false },
                  splitLine: { lineStyle: { color: "#e2e8f0" } },
                  axisLabel: { color: "#64748b", fontSize: 11 },
                },
                {
                  type: "value",
                  minInterval: 1,
                  axisLine: { show: false },
                  axisTick: { show: false },
                  splitLine: { show: false },
                  axisLabel: { color: "#64748b", fontSize: 11 },
                },
              ],
              series: activeMetrics.map((metric) => ({
                name: metric.label,
                type: "line",
                yAxisIndex: metric.axis,
                data: trend.map((point) => point[metric.value] ?? null),
                smooth: true,
                showSymbol: false,
                areaStyle: activeMetrics.length === 1 ? { color: `${metric.value === "clicks" ? primary : metric.color}16` } : undefined,
                lineStyle: {
                  color: metric.value === "clicks" ? primary : metric.value === "impressions" ? accent : metric.color,
                  width: 2.5,
                },
                itemStyle: { color: metric.value === "clicks" ? primary : metric.value === "impressions" ? accent : metric.color },
              })),
            }}
            className="h-full w-full"
            ariaLabel="Traffic trend for the shared report period"
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
            No trend data is available for this report period.
          </div>
        )}
      </div>
    </div>
  );
}
