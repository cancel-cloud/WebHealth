"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { EchartsChart } from "@/components/echarts-chart";
import { requestJson } from "@/lib/client/api";

type WeeklyReviewRun = {
  id: string;
  reportId: string | null;
  status: "queued" | "processing" | "complete" | "skipped" | "failed";
  skipReason: string | null;
  actionableCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
};

type WeeklyReviewSummary = {
  watchedCount: number;
  quotaSkips: number;
  latestRun: WeeklyReviewRun | null;
  trend: { label: string; actionableCount: number; status: string }[];
};

function buildWeeklyReviewTrendOption(summary: WeeklyReviewSummary): EChartsOption {
  return {
    grid: { left: 4, right: 4, top: 8, bottom: 4, containLabel: false },
    xAxis: {
      type: "category",
      data: summary.trend.map((point) => point.label.slice(5)),
      show: false,
    },
    yAxis: { type: "value", show: false, minInterval: 1 },
    series: [
      {
        type: "bar",
        data: summary.trend.map((point) => point.actionableCount),
        barMaxWidth: 22,
        itemStyle: { color: "#2563eb", borderRadius: [4, 4, 0, 0] },
      },
    ],
    tooltip: { trigger: "axis" },
  };
}

export function WeeklyReviewCard() {
  const [summary, setSummary] = useState<WeeklyReviewSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void requestJson<WeeklyReviewSummary>("/api/weekly-reviews/latest")
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!summary?.latestRun) return;
    const today = new Date();
    if (today.getDay() !== 1) return;
    const shouldNotify =
      summary.latestRun.actionableCount > 0 ||
      (summary.latestRun.status === "skipped" && summary.latestRun.skipReason === "quota") ||
      summary.quotaSkips > 0;
    if (!shouldNotify) return;

    const storageKey = `webhealth:weekly-review-sonner:${summary.latestRun.id}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "1");
    toast(summary.latestRun.actionableCount > 0 ? "Weekly review has findings" : "Weekly review skipped by quota", {
      description:
        summary.latestRun.actionableCount > 0
          ? `${summary.latestRun.actionableCount} changed-page finding${summary.latestRun.actionableCount === 1 ? "" : "s"} need a look.`
          : "The watched property could not be reviewed because the monthly report quota is exhausted.",
    });
  }, [summary]);

  const option = useMemo(
    () => (summary ? buildWeeklyReviewTrendOption(summary) : null),
    [summary],
  );

  const latestRun = summary?.latestRun ?? null;
  const cardHref = latestRun?.reportId ? `/reports/${latestRun.reportId}` : "/properties";

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold font-display">Weekly Review</h2>
            {latestRun?.status ? <Badge variant="outline">{latestRun.status}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {summary
              ? `${summary.watchedCount} watched ${summary.watchedCount === 1 ? "property" : "properties"}`
              : "Loading watched properties"}
            {latestRun ? ` · ${latestRun.actionableCount} actionable` : ""}
            {summary?.quotaSkips ? ` · ${summary.quotaSkips} quota skip${summary.quotaSkips === 1 ? "" : "s"}` : ""}
          </p>
          {latestRun ? (
            <p className="text-sm">
              {latestRun.status === "skipped" && latestRun.skipReason === "quota"
                ? "Monthly report quota was exhausted before the weekly review could run."
                : `Latest week: ${new Date(latestRun.dateRangeStart).toLocaleDateString()} - ${new Date(latestRun.dateRangeEnd).toLocaleDateString()}`}
            </p>
          ) : (
            <p className="text-sm">Choose watched GSC properties to start automatic weekly reviews.</p>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="h-20 w-40">
            {option ? (
              <EchartsChart
                option={option}
                className="h-full w-full"
                ariaLabel="Weekly review actionable finding trend"
              />
            ) : null}
          </div>
          <Link
            href={cardHref}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {latestRun?.reportId ? "Open report" : "Watch properties"}
          </Link>
        </div>
      </div>
    </section>
  );
}
