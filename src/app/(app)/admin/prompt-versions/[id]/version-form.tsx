"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PromptVersion = {
  id: string;
  name: string;
  template: string;
  examples: string | null;
  schemaVersion: string;
  isActive: boolean;
};

export function VersionForm({ initialVersion }: { initialVersion: PromptVersion | null }) {
  const router = useRouter();
  const isNew = initialVersion === null;

  const [state, setState] = useState({
    name: initialVersion?.name ?? "",
    template: initialVersion?.template ?? "",
    examples: initialVersion?.examples ?? "",
    schemaVersion: initialVersion?.schemaVersion ?? "v2",
    saving: false,
    saved: false,
    activating: false,
    duplicating: false,
    error: "",
  });

  async function save() {
    setState((s) => ({ ...s, saving: true, saved: false, error: "" }));
    try {
      if (!state.name.trim()) throw new Error("Name is required.");
      if (!state.template.trim()) throw new Error("Template is required.");

      let res: Response;
      if (isNew) {
        res = await fetch("/api/admin/prompt-versions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: state.name.trim(),
            template: state.template.trim(),
            examples: state.examples.trim() || null,
            schemaVersion: state.schemaVersion,
          }),
        });
      } else {
        res = await fetch("/api/admin/prompt-versions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: initialVersion.id,
            name: state.name.trim(),
            template: state.template.trim(),
            examples: state.examples.trim() || null,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setState((s) => ({ ...s, saving: false, saved: true }));

      if (isNew && data.version?.id) {
        router.push(`/admin/prompt-versions/${data.version.id}`);
      }
    } catch (err) {
      setState((s) => ({ ...s, saving: false, error: err instanceof Error ? err.message : "Save failed" }));
    }
  }

  async function setActive() {
    if (!initialVersion) return;
    setState((s) => ({ ...s, activating: true, error: "" }));
    try {
      const res = await fetch("/api/admin/prompt-versions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialVersion.id, isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to activate");
      setState((s) => ({ ...s, activating: false }));
      router.refresh();
    } catch (err) {
      setState((s) => ({ ...s, activating: false, error: err instanceof Error ? err.message : "Activation failed" }));
    }
  }

  async function duplicate() {
    if (!initialVersion) return;
    setState((s) => ({ ...s, duplicating: true, error: "" }));
    try {
      const res = await fetch("/api/admin/prompt-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${state.name} (copy)`,
          template: state.template.trim(),
          examples: state.examples.trim() || null,
          schemaVersion: state.schemaVersion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to duplicate");
      setState((s) => ({ ...s, duplicating: false }));
      router.push(`/admin/prompt-versions/${data.version.id}`);
    } catch (err) {
      setState((s) => ({ ...s, duplicating: false, error: err instanceof Error ? err.message : "Duplicate failed" }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value, saved: false }))}
            placeholder="e.g. v2 baseline prompt"
          />
        </div>
        <div className="space-y-2">
          <Label>Schema Version</Label>
          <Select
            value={state.schemaVersion}
            onValueChange={(v) => setState((s) => ({ ...s, schemaVersion: v, saved: false }))}
            disabled={!isNew}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="v1">v1</SelectItem>
              <SelectItem value="v2">v2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Template</Label>
        <textarea
          value={state.template}
          onChange={(e) => setState((s) => ({ ...s, template: e.target.value, saved: false }))}
          className="min-h-64 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
          placeholder="System instructions and prompt template..."
        />
      </div>

      <div className="space-y-2">
        <Label>Examples (optional)</Label>
        <textarea
          value={state.examples}
          onChange={(e) => setState((s) => ({ ...s, examples: e.target.value, saved: false }))}
          className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
          placeholder="Few-shot examples..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={state.saving}>
          {state.saving ? "Saving..." : state.saved ? "Saved" : "Save"}
        </Button>
        {!isNew && (
          <>
            <Button variant="outline" onClick={setActive} disabled={state.activating || initialVersion?.isActive}>
              {state.activating ? "Activating..." : initialVersion?.isActive ? "Currently Active" : "Set as Active"}
            </Button>
            <Button variant="outline" onClick={duplicate} disabled={state.duplicating}>
              {state.duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
          </>
        )}
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </div>
  );
}
