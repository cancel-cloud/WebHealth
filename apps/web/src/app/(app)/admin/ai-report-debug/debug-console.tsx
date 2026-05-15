"use client";

import { useEffect, useMemo, useState } from "react";
import { requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

type JobActivityItem = {
  id: string;
  family: "source_data" | "property_refresh";
  label: string;
  teamId: string;
  propertyId: string | null;
  kind: string;
  status: string;
  phase: string;
  attempts: number | null;
  maxAttempts: number | null;
  claimedBy: string | null;
  heartbeatAt: string | null;
  claimExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  usage: Record<string, unknown> | null;
};

type DebugResponse = {
  stats: {
    queued: number;
    processing: number;
    failed: number;
    total: number;
  };
  dailyCosts: Array<{ sourceDate: string; totalUsd: string }>;
  estimatedDailyCosts: Array<{ sourceDate: string; totalUsd: string }>;
  jobActivity: {
    counts: {
      sourceData: { queued: number; active: number; failed: number; total: number };
      propertyRefresh: { queued: number; active: number; failed: number; total: number };
    };
    items: JobActivityItem[];
  };
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatUsd(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatUsage(usage: Record<string, unknown> | null) {
  if (!usage) return "-";
  const pairs = Object.entries(usage)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return pairs.length ? pairs.join(" · ") : "-";
}

export function DebugConsole() {
  const [data, setData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await requestJson<DebugResponse>("/api/admin/ai-reports/debug"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const actualOpenAiTotal = useMemo(
    () => data?.dailyCosts.reduce((sum, row) => sum + Number(row.totalUsd ?? 0), 0) ?? 0,
    [data],
  );
  const estimatedOpenAiTotal = useMemo(
    () => data?.estimatedDailyCosts.reduce((sum, row) => sum + Number(row.totalUsd ?? 0), 0) ?? 0,
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Queued ops" value={data?.stats.queued ?? 0} />
        <MetricCard label="Active ops" value={data?.stats.processing ?? 0} />
        <MetricCard label="Failed ops" value={data?.stats.failed ?? 0} />
        <MetricCard label="AI run estimate" value={formatUsd(estimatedOpenAiTotal)} />
        <MetricCard label="OpenAI billed cost" value={formatUsd(actualOpenAiTotal)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FamilyCard
          title="Source Data"
          queued={data?.jobActivity.counts.sourceData.queued ?? 0}
          active={data?.jobActivity.counts.sourceData.active ?? 0}
          failed={data?.jobActivity.counts.sourceData.failed ?? 0}
          total={data?.jobActivity.counts.sourceData.total ?? 0}
        />
        <FamilyCard
          title="Property Refresh"
          queued={data?.jobActivity.counts.propertyRefresh.queued ?? 0}
          active={data?.jobActivity.counts.propertyRefresh.active ?? 0}
          failed={data?.jobActivity.counts.propertyRefresh.failed ?? 0}
          total={data?.jobActivity.counts.propertyRefresh.total ?? 0}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">Last Jobs</h2>
          <p className="text-sm text-muted-foreground">Source-data and property-refresh activity, sorted by latest update.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Family</th>
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Phase</th>
                <th className="py-2 pr-4">Usage</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2 pr-4">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.jobActivity.items ?? []).map((job) => (
                <tr key={job.id}>
                  <td className="py-2 pr-4">{job.family === "source_data" ? "Source data" : "Property refresh"}</td>
                  <td className="py-2 pr-4">
                    <div className="font-medium">{job.label}</div>
                    <div className="text-xs text-muted-foreground">{job.propertyId ?? job.teamId}</div>
                  </td>
                  <td className="py-2 pr-4">{job.status}</td>
                  <td className="py-2 pr-4">{job.phase}</td>
                  <td className="py-2 pr-4 text-xs">{formatUsage(job.usage)}</td>
                  <td className="py-2 pr-4">{formatDate(job.updatedAt)}</td>
                  <td className="py-2 pr-4 text-xs text-destructive">{job.lastError ?? "-"}</td>
                </tr>
              ))}
              {!data?.jobActivity.items.length ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={7}>
                    No job activity found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function FamilyCard({
  title,
  queued,
  active,
  failed,
  total,
}: {
  title: string;
  queued: number;
  active: number;
  failed: number;
  total: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
        <Metric label="Queued" value={queued} />
        <Metric label="Active" value={active} />
        <Metric label="Failed" value={failed} />
        <Metric label="Total" value={total} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
