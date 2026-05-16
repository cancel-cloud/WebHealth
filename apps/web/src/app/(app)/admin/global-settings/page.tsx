import { headers } from "next/headers";
import { SettingsForm } from "./settings-form";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function GlobalSettingsPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].globalSettings;
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
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
