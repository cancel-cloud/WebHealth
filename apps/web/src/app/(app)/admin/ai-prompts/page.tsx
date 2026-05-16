import { headers } from "next/headers";
import { AiPromptsEditor } from "./prompts-editor";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function AdminAiPromptsPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].aiPrompts;
  const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/admin/ai-prompts`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  });
  const data = await res.json();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
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
