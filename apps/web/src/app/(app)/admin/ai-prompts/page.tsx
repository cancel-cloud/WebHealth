import { headers } from "next/headers";
import { AiPromptsEditor } from "./prompts-editor";

export default async function AdminAiPromptsPage() {
  const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/admin/ai-prompts`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  });
  const data = await res.json();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Prompt Templates</h1>
        <p className="text-muted-foreground text-sm">
          Versioned system prompts for source summaries and the main SEO analyzer. Saving creates a new active version.
        </p>
      </div>
      <AiPromptsEditor
        initialTemplates={data.templates ?? []}
        initialRuntimeSettings={data.runtimeSettings ?? null}
        latestRuns={data.latestRuns ?? []}
      />
    </div>
  );
}
