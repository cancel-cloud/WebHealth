"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";

type Settings = {
  id: string;
  model: string;
  outputStrategy: "json_schema" | "tool_strict";
  temperature: string | number;
  maxOutputTokens: number;
  inputTokenBudget: number;
  language: string;
  serviceTier: string;
  useBackgroundMode: boolean;
  usePromptCaching: boolean;
  useStrictSchema: boolean;
  schemaVersion: string;
  promptVersionId: string | null;
};

type PromptVersion = {
  id: string;
  name: string;
  template: string;
  examples?: string | null;
  schemaVersion: string;
};

export function SettingsForm({
  initialSettings,
  prompts,
}: {
  initialSettings: Settings | null;
  prompts: PromptVersion[];
}) {
  const activePrompt = prompts.find((p) => p.id === initialSettings?.promptVersionId) ?? prompts.at(-1) ?? null;
  const [state, setState] = useState({
    model: initialSettings?.model ?? "gpt-5-mini",
    outputStrategy: initialSettings?.outputStrategy ?? "json_schema",
    temperature: String(initialSettings?.temperature ?? "0.2"),
    maxOutputTokens: String(initialSettings?.maxOutputTokens ?? 6000),
    inputTokenBudget: String(initialSettings?.inputTokenBudget ?? 90000),
    language: initialSettings?.language ?? "de",
    serviceTier: initialSettings?.serviceTier ?? "default",
    useBackgroundMode: initialSettings?.useBackgroundMode ?? true,
    usePromptCaching: initialSettings?.usePromptCaching ?? true,
    useStrictSchema: initialSettings?.useStrictSchema ?? true,
    schemaVersion: initialSettings?.schemaVersion ?? "v1",
    masterPrompt: activePrompt?.template ?? "",
    promptExamples: activePrompt?.examples ?? "",
    saving: false,
    saved: false,
    error: "",
  });

  async function save() {
    setState((s) => ({ ...s, saving: true, saved: false, error: "" }));
    try {
      const parsedMaxOutputTokens = Number.parseInt(state.maxOutputTokens.trim(), 10);
      const parsedInputTokenBudget = Number.parseInt(state.inputTokenBudget.trim(), 10);
      const parsedTemperature = Number.parseFloat(state.temperature.trim());
      if (!Number.isFinite(parsedMaxOutputTokens) || parsedMaxOutputTokens < 0) {
        throw new Error("Max output tokens must be 0 or a positive integer.");
      }
      if (!Number.isFinite(parsedInputTokenBudget) || parsedInputTokenBudget <= 0) {
        throw new Error("Input token budget must be a positive integer.");
      }
      if (!Number.isFinite(parsedTemperature)) {
        throw new Error("Temperature must be a valid number.");
      }

      await requestJson("/api/admin/ai-report-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: state.model,
          outputStrategy: state.outputStrategy,
          temperature: parsedTemperature,
          maxOutputTokens: parsedMaxOutputTokens,
          inputTokenBudget: parsedInputTokenBudget,
          language: state.language,
          serviceTier: state.serviceTier,
          useBackgroundMode: state.useBackgroundMode,
          usePromptCaching: state.usePromptCaching,
          useStrictSchema: state.useStrictSchema,
          schemaVersion: state.schemaVersion,
          masterPrompt: state.masterPrompt,
          promptExamples: state.promptExamples,
        }),
      });
      setState((s) => ({ ...s, saving: false, saved: true }));
    } catch (error) {
      setState((s) => ({ ...s, saving: false, error: getAppErrorMessage(error, "Save failed") }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Input value={state.model} onChange={(e) => setState((s) => ({ ...s, model: e.target.value, saved: false }))} />
        </div>
        <div className="space-y-2">
          <Label>Output Strategy</Label>
          <Select
            value={state.outputStrategy}
            onValueChange={(v: "json_schema" | "tool_strict") =>
              setState((s) => ({ ...s, outputStrategy: v, saved: false }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="json_schema">json_schema</SelectItem>
              <SelectItem value="tool_strict">tool_strict</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Temperature</Label>
          <Input value={state.temperature} onChange={(e) => setState((s) => ({ ...s, temperature: e.target.value, saved: false }))} />
        </div>
        <div className="space-y-2">
          <Label>Max Output Tokens</Label>
          <Input value={state.maxOutputTokens} onChange={(e) => setState((s) => ({ ...s, maxOutputTokens: e.target.value, saved: false }))} />
          <p className="text-xs text-muted-foreground">Set to 0 for no explicit output cap.</p>
        </div>
        <div className="space-y-2">
          <Label>Input Token Budget</Label>
          <Input value={state.inputTokenBudget} onChange={(e) => setState((s) => ({ ...s, inputTokenBudget: e.target.value, saved: false }))} />
        </div>
        <div className="space-y-2">
          <Label>Schema Version</Label>
          <Input value={state.schemaVersion} onChange={(e) => setState((s) => ({ ...s, schemaVersion: e.target.value, saved: false }))} />
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Input value={state.language} onChange={(e) => setState((s) => ({ ...s, language: e.target.value, saved: false }))} />
        </div>
        <div className="space-y-2">
          <Label>Service Tier</Label>
          <Input value={state.serviceTier} onChange={(e) => setState((s) => ({ ...s, serviceTier: e.target.value, saved: false }))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={state.useBackgroundMode} onCheckedChange={(v) => setState((s) => ({ ...s, useBackgroundMode: v, saved: false }))} />
          <Label>Background Mode</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={state.usePromptCaching} onCheckedChange={(v) => setState((s) => ({ ...s, usePromptCaching: v, saved: false }))} />
          <Label>Prompt Caching</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={state.useStrictSchema} onCheckedChange={(v) => setState((s) => ({ ...s, useStrictSchema: v, saved: false }))} />
          <Label>Strict Schema</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Master Prompt</Label>
        <textarea
          value={state.masterPrompt}
          onChange={(e) => setState((s) => ({ ...s, masterPrompt: e.target.value, saved: false }))}
          className="min-h-52 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label>Prompt Examples (optional)</Label>
        <textarea
          value={state.promptExamples}
          onChange={(e) => setState((s) => ({ ...s, promptExamples: e.target.value, saved: false }))}
          className="min-h-32 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={state.saving}>
          {state.saving ? "Saving..." : state.saved ? "Saved ✓" : "Save"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </div>
  );
}
