import { headers } from "next/headers";
import { SettingsForm } from "./settings-form";

export default async function GlobalSettingsPage() {
  const res = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/admin/global-settings`,
    {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
      cache: "no-store",
    },
  );
  const data = await res.json();
  const settings = data.settings ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure plan tier limits. Leave blank for unlimited.
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
