"use client";

import { EchartsChart, type EChartsOption } from "@/components/echarts-chart";

type ActualSpendPoint = {
  date: string;
  totalUsd: number;
};

type JobThroughputPoint = {
  family: string;
  queued: number;
  processing: number;
  complete: number;
  failed: number;
  partial: number;
};

function currencyAxis(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ProductAnalyticsCharts({
  actualSpend,
  jobThroughput,
}: {
  actualSpend: ActualSpendPoint[];
  jobThroughput: JobThroughputPoint[];
}) {
  const actualSpendOption: EChartsOption = {
    tooltip: { trigger: "axis", valueFormatter: (value) => currencyAxis(Number(value)) },
    grid: { left: 54, right: 18, top: 28, bottom: 34 },
    xAxis: {
      type: "category",
      data: actualSpend.map((point) => point.date),
      boundaryGap: false,
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b", fontSize: 11, formatter: (value: number) => currencyAxis(value) },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    series: [
      {
        name: "Actual OpenAI",
        type: "line",
        smooth: true,
        showSymbol: false,
        areaStyle: { color: "#0ea5e933" },
        lineStyle: { color: "#0ea5e9", width: 2.5 },
        itemStyle: { color: "#0ea5e9" },
        data: actualSpend.map((point) => point.totalUsd),
      },
    ],
  };

  const jobThroughputOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { top: 0, textStyle: { color: "#64748b" } },
    grid: { left: 42, right: 18, top: 42, bottom: 34 },
    xAxis: {
      type: "category",
      data: jobThroughput.map((point) => point.family),
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#64748b", fontSize: 11 },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    series: [
      { name: "Queued", type: "bar", stack: "jobs", itemStyle: { color: "#94a3b8" }, data: jobThroughput.map((point) => point.queued) },
      { name: "Processing", type: "bar", stack: "jobs", itemStyle: { color: "#0ea5e9" }, data: jobThroughput.map((point) => point.processing) },
      { name: "Complete", type: "bar", stack: "jobs", itemStyle: { color: "#10b981" }, data: jobThroughput.map((point) => point.complete) },
      { name: "Partial", type: "bar", stack: "jobs", itemStyle: { color: "#f59e0b" }, data: jobThroughput.map((point) => point.partial) },
      { name: "Failed", type: "bar", stack: "jobs", itemStyle: { color: "#ef4444" }, data: jobThroughput.map((point) => point.failed) },
    ],
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold font-display">Actual OpenAI Spend</h2>
        <div className="mt-4 h-[280px]">
          {actualSpend.length ? (
            <EchartsChart option={actualSpendOption} className="h-full w-full" ariaLabel="Actual OpenAI daily spend" />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              No imported OpenAI billing data yet.
            </div>
          )}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold font-display">Job Throughput</h2>
        <div className="mt-4 h-[280px]">
          {jobThroughput.length ? (
            <EchartsChart option={jobThroughputOption} className="h-full w-full" ariaLabel="Job throughput by family and status" />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              No job throughput data yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
