"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type TeamRow = { id: string; name: string };
type PropertyRow = {
  id: string; // canonical GSC property ID used for report creation
  teamId: string;
  label: string;
  gscPropertyId: string;
  ga4DbId: string | null;
  ga4PropertyId: string | null;
  isLinked: boolean;
};

type DebugStatsResponse = {
  stats: {
    activeJobsGlobal: number;
    queuedJobsCount: number;
    activeJobsPerTeam: { teamId: string; activeJobs: number }[];
    leasedJobs: Array<{
      id: string;
      reportId: string;
      teamId: string;
      kind: string;
      phase: string;
      status: string;
      attempts: number;
      claimedBy: string | null;
      claimExpiresAt: string | null;
      heartbeatAt: string | null;
    }>;
  };
  jobs: Array<{
    id: string;
    reportId: string;
    teamId: string;
    kind: string;
    status: string;
    phase: string;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    claimedBy: string | null;
    claimExpiresAt: string | null;
    heartbeatAt: string | null;
    createdAt: string;
    report?: {
      id: string;
      aiEstimatedCostUsd: string | null;
      aiUsage: unknown;
      openaiRequestIds: unknown;
      aiStatus: string | null;
      xlsxStatus: string | null;
    } | null;
  }>;

  detailRequests?: Array<{
    id: string;
    reportId: string;
    teamId: string;
    teamName: string | null;
    requestedByUserId: string | null;
    requestedByUserEmail: string | null;
    requestNumber: number;
    kind: string;
    rowId: string;
    status: string;
    usage: unknown;
    estimatedCostUsd: string | null;
    xRequestId: string | null;
    xClientRequestId: string | null;
    error: string | null;
    createdAt: string;
  }>;
};

type EventRow = {
  id: string;
  jobId: string;
  reportId: string;
  teamId: string;
  phase: string;
  level: "info" | "warn" | "error";
  message: string;
  meta: unknown;
  createdAt: string;
};

type UsageLike = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
  raw?: UsageLike;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
};

type RequestIdTrace = {
  phase?: string;
  xRequestId?: string | null;
  xClientRequestId?: string | null;
};

function asUsageLike(raw: unknown): UsageLike | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as UsageLike;
  if (obj.raw && typeof obj.raw === "object") return obj.raw;
  return obj;
}

function pickNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

async function pollUntilComplete(reportId: string): Promise<void> {
  const maxPolls = 60;
  for (let i = 0; i < maxPolls; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const res = await fetch(`/api/reports/${reportId}`);
    if (!res.ok) throw new Error("Failed to check report status");
    const data = (await res.json()) as { report?: { status?: string; error?: string | null } };
    const status = data.report?.status;
    if (status === "complete") return;
    if (status === "failed") throw new Error(data.report?.error ?? "Report processing failed");
  }
  throw new Error("Report timed out");
}

export function DebugConsole({
  teams,
  properties,
}: {
  teams: TeamRow[];
  properties: PropertyRow[];
}) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id ?? "");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [modelOverride, setModelOverride] = useState("");
  const [sitemapUrlOverride, setSitemapUrlOverride] = useState("");
  const [runXlsx, setRunXlsx] = useState(true);
  const [reportFilter, setReportFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [debug, setDebug] = useState<DebugStatsResponse | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const teamProperties = useMemo(
    () => properties.filter((p) => p.teamId === selectedTeamId),
    [properties, selectedTeamId]
  );

  useEffect(() => {
    if (!selectedPropertyId && teamProperties[0]) {
      setSelectedPropertyId(teamProperties[0].id);
    } else if (selectedPropertyId && !teamProperties.some((p) => p.id === selectedPropertyId)) {
      setSelectedPropertyId(teamProperties[0]?.id ?? "");
    }
  }, [selectedPropertyId, teamProperties]);

  const refresh = useCallback(async () => {
    const [debugRes, eventsRes] = await Promise.all([
      fetch("/api/admin/ai-reports/debug"),
      fetch(
        `/api/admin/ai-reports/events?limit=200${reportFilter ? `&reportId=${encodeURIComponent(reportFilter)}` : ""}${jobFilter ? `&jobId=${encodeURIComponent(jobFilter)}` : ""}`
      ),
    ]);
    const debugJson = await debugRes.json();
    const eventsJson = await eventsRes.json();
    if (!debugRes.ok) throw new Error(debugJson.error ?? "Failed to load debug stats");
    if (!eventsRes.ok) throw new Error(eventsJson.error ?? "Failed to load events");
    setDebug(debugJson);
    setEvents(eventsJson.events ?? []);
  }, [jobFilter, reportFilter]);

  useEffect(() => {
    void refresh().catch((e) => setError(e instanceof Error ? e.message : "Failed to load debug data"));
    const t = setInterval(() => {
      void refresh().catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  async function generateTestReport() {
    if (!selectedTeamId || !selectedPropertyId) {
      setError("Select a team and property first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-reports/test-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          propertyId: selectedPropertyId,
          options: {
            modelOverride: modelOverride || undefined,
            runXlsx,
            sitemapUrlOverride: sitemapUrlOverride || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate test report");
      setReportFilter(data.reportId);
      void refresh();
      router.push(`/reports/${data.reportId}`);
      toast.promise(pollUntilComplete(data.reportId), {
        loading: "Processing report…",
        success: "Report ready!",
        error: (err) => (err instanceof Error ? err.message : "Report processing failed"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate test report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border p-4 space-y-4 bg-card">
        <h2 className="font-semibold text-lg">Generate a Test Report</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Team</Label>
            <select
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Property</Label>
            <select
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              {teamProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Model Override (optional)</Label>
            <Input value={modelOverride} onChange={(e) => setModelOverride(e.target.value)} placeholder="gpt-5-mini" />
          </div>
          <div className="space-y-2">
            <Label>Sitemap URL Override (optional)</Label>
            <Input value={sitemapUrlOverride} onChange={(e) => setSitemapUrlOverride(e.target.value)} placeholder="https://example.com/sitemap.xml" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="run-xlsx"
            type="checkbox"
            checked={runXlsx}
            onChange={(e) => setRunXlsx(e.target.checked)}
          />
          <Label htmlFor="run-xlsx">AI + XLSX (disable for AI-only)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={generateTestReport} disabled={loading}>
            {loading ? "Creating..." : "Generate Test Report"}
          </Button>
          <Button variant="outline" onClick={() => void refresh()}>
            Refresh Debug Data
          </Button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-lg border p-4 space-y-4 bg-card">
        <h2 className="font-semibold text-lg">Worker Status</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Badge variant="outline">Active Jobs (global): {debug?.stats.activeJobsGlobal ?? 0}</Badge>
          <Badge variant="outline">Queued Jobs: {debug?.stats.queuedJobsCount ?? 0}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {debug?.stats.activeJobsPerTeam.map((t) => `${t.teamId}: ${t.activeJobs}`).join(" • ") || "No active team jobs"}
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Job</th>
                <th className="text-left py-2">Kind</th>
                <th className="text-left py-2">Team</th>
                <th className="text-left py-2">Worker</th>
                <th className="text-left py-2">Heartbeat</th>
                <th className="text-left py-2">Lease Expires</th>
              </tr>
            </thead>
            <tbody>
              {(debug?.stats.leasedJobs ?? []).map((j) => (
                <tr key={j.id} className="border-b">
                  <td className="py-2">{j.id}</td>
                  <td className="py-2">{j.kind}</td>
                  <td className="py-2">{j.teamId}</td>
                  <td className="py-2">{j.claimedBy ?? "-"}</td>
                  <td className="py-2">{j.heartbeatAt ? new Date(j.heartbeatAt).toLocaleString() : "-"}</td>
                  <td className="py-2">{j.claimExpiresAt ? new Date(j.claimExpiresAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4 bg-card">
        <h2 className="font-semibold text-lg">Details Requests</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Report</th>
                <th className="text-left py-2">Team</th>
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Kind</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Usage</th>
                <th className="text-left py-2">Est. Cost</th>
                <th className="text-left py-2">Request IDs</th>
                <th className="text-left py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {(debug?.detailRequests ?? []).map((req) => {
                const usage = asUsageLike(req.usage);
                const inputTokens = pickNumber(usage?.input_tokens, usage?.inputTokens);
                const outputTokens = pickNumber(usage?.output_tokens, usage?.outputTokens);
                const totalTokens = pickNumber(usage?.total_tokens, usage?.totalTokens);
                const cachedTokens = pickNumber(
                  usage?.input_tokens_details?.cached_tokens,
                  usage?.cachedInputTokens
                );
                return (
                  <tr key={req.id} className="border-b align-top">
                    <td className="py-2">{req.requestNumber}</td>
                    <td className="py-2">
                      <button className="underline" onClick={() => router.push(`/reports/${req.reportId}`)}>
                        {req.reportId}
                      </button>
                    </td>
                    <td className="py-2">{req.teamName ?? req.teamId}</td>
                    <td className="py-2">{req.requestedByUserEmail ?? req.requestedByUserId ?? "-"}</td>
                    <td className="py-2">
                      {req.kind}
                      <div className="text-xs text-muted-foreground">{req.rowId}</div>
                    </td>
                    <td className="py-2">
                      <Badge variant="outline">{req.status}</Badge>
                      {req.error ? <div className="text-xs text-red-600 mt-1">{req.error}</div> : null}
                    </td>
                    <td className="py-2 text-xs">
                      in:{inputTokens ?? "-"} out:{outputTokens ?? "-"} total:{totalTokens ?? "-"} cached:{cachedTokens ?? "-"}
                    </td>
                    <td className="py-2">{req.estimatedCostUsd ?? "-"}</td>
                    <td className="py-2 text-xs whitespace-pre-wrap">
                      {`${req.xRequestId ?? "-"}\n${req.xClientRequestId ?? "-"}`}
                    </td>
                    <td className="py-2">{new Date(req.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {(debug?.detailRequests?.length ?? 0) === 0 ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={10}>
                    No detail requests recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4 bg-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Filter by Report ID</Label>
            <Input value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} placeholder="rep_xxx" />
          </div>
          <div className="space-y-1">
            <Label>Filter by Job ID</Label>
            <Input value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} placeholder="rj_xxx" />
          </div>
        </div>

        <h2 className="font-semibold text-lg">Last Jobs + AI Cost/Usage</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Job</th>
                <th className="text-left py-2">Report</th>
                <th className="text-left py-2">Kind</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Phase</th>
                <th className="text-left py-2">Attempts</th>
                <th className="text-left py-2">Usage</th>
                <th className="text-left py-2">Est. Cost</th>
                <th className="text-left py-2">Request IDs</th>
              </tr>
            </thead>
            <tbody>
              {(debug?.jobs ?? []).map((j) => {
                const ids = Array.isArray(j.report?.openaiRequestIds)
                  ? (j.report?.openaiRequestIds as RequestIdTrace[])
                  : [];
                const usage = asUsageLike(j.report?.aiUsage ?? null);
                const inputTokens = pickNumber(usage?.input_tokens, usage?.inputTokens);
                const outputTokens = pickNumber(usage?.output_tokens, usage?.outputTokens);
                const totalTokens = pickNumber(usage?.total_tokens, usage?.totalTokens);
                const cachedTokens = pickNumber(
                  usage?.input_tokens_details?.cached_tokens,
                  usage?.cachedInputTokens
                );
                return (
                  <tr key={j.id} className="border-b align-top">
                    <td className="py-2">{j.id}</td>
                    <td className="py-2">
                      <button className="underline" onClick={() => router.push(`/reports/${j.reportId}`)}>
                        {j.reportId}
                      </button>
                    </td>
                    <td className="py-2">{j.kind}</td>
                    <td className="py-2"><Badge variant="outline">{j.status}</Badge></td>
                    <td className="py-2">{j.phase}</td>
                    <td className="py-2">{j.attempts}/{j.maxAttempts}</td>
                    <td className="py-2 text-xs">
                      in:{inputTokens ?? "-"} out:{outputTokens ?? "-"} total:{totalTokens ?? "-"} cached:{cachedTokens ?? "-"}
                    </td>
                    <td className="py-2">{j.report?.aiEstimatedCostUsd ?? "-"}</td>
                    <td className="py-2 text-xs">
                      {ids.length
                        ? ids.slice(0, 2).map((r) => `${r.phase ?? "?"}: ${r.xRequestId ?? "-"} / ${r.xClientRequestId ?? "-"}`).join("\n")
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4 bg-card">
        <h2 className="font-semibold text-lg">Live Debug Timeline</h2>
        <div className="max-h-[500px] overflow-auto space-y-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="font-medium">{e.phase}</span>
                <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                <span className="text-muted-foreground">job {e.jobId}</span>
                <span className="text-muted-foreground">report {e.reportId}</span>
              </div>
              <div className="mt-1">{e.message}</div>
              {e.meta ? (
                <pre className="mt-2 text-xs bg-muted/40 p-2 rounded overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(e.meta, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
