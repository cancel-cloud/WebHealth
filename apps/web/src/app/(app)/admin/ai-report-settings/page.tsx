import { headers } from "next/headers";
import { SettingsForm } from "./settings-form";

export default async function AiReportSettingsPage() {
  const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/admin/ai-report-settings`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  });
  const data = await res.json();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Report Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure the master prompt, model, output strategy, and runtime controls for AI report generation.
        </p>
      </div>
      <SettingsForm initialSettings={data.settings ?? null} prompts={data.prompts ?? []} />
    </div>
  );
}
