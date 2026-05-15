"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";

type AiPromptTemplate = {
  id: string;
  purpose: string;
  version: number;
  name: string;
  systemPrompt: string;
  isActive: boolean;
  updatedAt: string;
};

type EditablePrompt = AiPromptTemplate & {
  draftName: string;
  draftPrompt: string;
  saving: boolean;
};

type AiRuntimeSettings = {
  summaryModel: string;
  analyzerModel: string;
  maxOutputTokens: number;
  updatedAt?: string;
};

type LatestAiRun = {
  id: string;
  propertyId: string;
  propertyName: string | null;
  status: string;
  phase: string;
  summaryModel: string | null;
  analyzerModel: string | null;
  usageSnapshot: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
  } | null;
  costEstimateUsd: string | null;
  error: string | null;
  updatedAt: string;
  finishedAt: string | null;
};

type RuntimeSettingsDraft = {
  summaryModel: string;
  analyzerModel: string;
  maxOutputTokens: string;
};

const PURPOSE_LABELS: Record<string, string> = {
  gsc_source_summary: "GSC source summary",
  ga4_source_summary: "GA4 source summary",
  crawl_source_summary: "Crawl source summary",
  main_analyzer: "Main analyzer",
};

const DEFAULT_RUNTIME_SETTINGS: AiRuntimeSettings = {
  summaryModel: "gpt-5-mini",
  analyzerModel: "gpt-5-mini",
  maxOutputTokens: 128000,
};

function groupActiveTemplates(templates: AiPromptTemplate[]) {
  const byPurpose = new Map<string, AiPromptTemplate>();
  for (const template of templates) {
    const current = byPurpose.get(template.purpose);
    if (!current || template.isActive || template.version > current.version) {
      byPurpose.set(template.purpose, template);
    }
  }
  return [...byPurpose.values()].sort((left, right) => left.purpose.localeCompare(right.purpose));
}

function formatRunDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatUsd(value: string | null) {
  if (!value) return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(parsed);
}

function formatUsage(usage: LatestAiRun["usageSnapshot"]) {
  if (!usage) return "No token usage recorded";
  return [
    `input ${usage.inputTokens ?? 0}`,
    `output ${usage.outputTokens ?? 0}`,
    `total ${usage.totalTokens ?? 0}`,
    `reasoning ${usage.reasoningTokens ?? 0}`,
  ].join(" / ");
}

export function AiPromptsEditor({
  initialTemplates,
  initialRuntimeSettings,
  latestRuns,
}: {
  initialTemplates: AiPromptTemplate[];
  initialRuntimeSettings: AiRuntimeSettings | null;
  latestRuns: LatestAiRun[];
}) {
  const initialRows = useMemo(() => groupActiveTemplates(initialTemplates), [initialTemplates]);
  const startingRuntimeSettings = initialRuntimeSettings ?? DEFAULT_RUNTIME_SETTINGS;
  const [rows, setRows] = useState<EditablePrompt[]>(() =>
    initialRows.map((row) => ({
      ...row,
      draftName: row.name,
      draftPrompt: row.systemPrompt,
      saving: false,
    })),
  );
  const [runtimeDraft, setRuntimeDraft] = useState<RuntimeSettingsDraft>({
    summaryModel: startingRuntimeSettings.summaryModel,
    analyzerModel: startingRuntimeSettings.analyzerModel,
    maxOutputTokens: String(startingRuntimeSettings.maxOutputTokens),
  });
  const [runtimeSaving, setRuntimeSaving] = useState(false);

  const updateRow = (purpose: string, patch: Partial<Pick<EditablePrompt, "draftName" | "draftPrompt">>) => {
    setRows((current) => current.map((row) => row.purpose === purpose ? { ...row, ...patch } : row));
  };

  const save = async (row: EditablePrompt) => {
    setRows((current) => current.map((item) => item.purpose === row.purpose ? { ...item, saving: true } : item));
    try {
      await requestJson("/api/admin/ai-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: row.purpose,
          name: row.draftName,
          systemPrompt: row.draftPrompt,
        }),
      });
      setRows((current) =>
        current.map((item) =>
          item.purpose === row.purpose
            ? {
                ...item,
                name: row.draftName,
                systemPrompt: row.draftPrompt,
                version: item.version + 1,
                saving: false,
              }
            : item,
        ),
      );
      toast.success("Prompt version saved.");
    } catch (error) {
      setRows((current) => current.map((item) => item.purpose === row.purpose ? { ...item, saving: false } : item));
      toast.error(getAppErrorMessage(error, "Could not save prompt template."));
    }
  };

  const saveRuntimeSettings = async () => {
    setRuntimeSaving(true);
    try {
      const maxOutputTokens = Number.parseInt(runtimeDraft.maxOutputTokens, 10);
      const response = await requestJson<{ runtimeSettings?: AiRuntimeSettings }>("/api/admin/ai-prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryModel: runtimeDraft.summaryModel,
          analyzerModel: runtimeDraft.analyzerModel,
          maxOutputTokens,
        }),
      });
      const saved = response?.runtimeSettings;
      if (saved) {
        setRuntimeDraft({
          summaryModel: saved.summaryModel,
          analyzerModel: saved.analyzerModel,
          maxOutputTokens: String(saved.maxOutputTokens),
        });
      }
      toast.success("AI runtime settings saved.");
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not save AI runtime settings."));
    } finally {
      setRuntimeSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">OpenAI runtime settings</h2>
          <p className="text-sm text-muted-foreground">
            Used by the worker for source summaries and analyzer calls. Changing this creates a new source-version hash on the next AI run.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
          <div>
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground" htmlFor="summary-model">
              Summary model
            </label>
            <Input
              id="summary-model"
              value={runtimeDraft.summaryModel}
              onChange={(event) => setRuntimeDraft((current) => ({ ...current, summaryModel: event.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground" htmlFor="analyzer-model">
              Analyzer model
            </label>
            <Input
              id="analyzer-model"
              value={runtimeDraft.analyzerModel}
              onChange={(event) => setRuntimeDraft((current) => ({ ...current, analyzerModel: event.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground" htmlFor="max-output-tokens">
              Max output tokens
            </label>
            <Input
              id="max-output-tokens"
              type="number"
              min={512}
              max={128000}
              step={1024}
              value={runtimeDraft.maxOutputTokens}
              onChange={(event) => setRuntimeDraft((current) => ({ ...current, maxOutputTokens: event.target.value }))}
              className="mt-1"
            />
          </div>
          <Button onClick={saveRuntimeSettings} disabled={runtimeSaving}>
            {runtimeSaving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">Latest AI run diagnostics</h2>
          <p className="text-sm text-muted-foreground">Recent worker outcomes with errors, token usage, and AI run estimates.</p>
        </div>
        <div className="space-y-3">
          {latestRuns.map((run) => (
            <div key={run.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={run.status === "failed" ? "destructive" : "outline"}>{run.status}</Badge>
                    <Badge variant="outline">{run.phase}</Badge>
                    <span className="text-sm font-medium">{run.propertyName ?? run.propertyId}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {run.summaryModel ?? "-"} summaries · {run.analyzerModel ?? "-"} analyzer · {formatUsage(run.usageSnapshot)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground md:text-right">
                  <div>{formatRunDate(run.updatedAt)}</div>
                  <div>AI run estimate {formatUsd(run.costEstimateUsd)}</div>
                </div>
              </div>
              {run.error ? (
                <pre className="mt-3 max-h-36 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs whitespace-pre-wrap text-destructive">
                  {run.error}
                </pre>
              ) : null}
            </div>
          ))}
          {!latestRuns.length ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              No AI runs have been recorded yet.
            </div>
          ) : null}
        </div>
      </section>

      {rows.map((row) => (
        <section key={row.purpose} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold">{PURPOSE_LABELS[row.purpose] ?? row.purpose}</h2>
                <Badge variant="outline">v{row.version}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Purpose: <span className="font-mono">{row.purpose}</span></p>
            </div>
            <Button onClick={() => save(row)} disabled={row.saving}>
              {row.saving ? "Saving..." : "Save new version"}
            </Button>
          </div>
          <div className="grid gap-3">
            <Input
              value={row.draftName}
              onChange={(event) => updateRow(row.purpose, { draftName: event.target.value })}
              aria-label={`${row.purpose} prompt name`}
            />
            <Textarea
              value={row.draftPrompt}
              onChange={(event) => updateRow(row.purpose, { draftPrompt: event.target.value })}
              aria-label={`${row.purpose} system prompt`}
              className="min-h-72 font-mono text-sm leading-6"
            />
          </div>
        </section>
      ))}
    </div>
  );
}
