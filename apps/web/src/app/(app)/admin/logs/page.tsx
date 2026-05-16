import { headers } from "next/headers";
import { LogsTable } from "./logs-table";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function AdminLogsPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].logs;
  const res = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/admin/logs?limit=50`,
    {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
      cache: "no-store",
    }
  );
  const data = await res.json();
  const logs = data.logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
        </p>
      </div>
      <LogsTable initialLogs={logs} />
    </div>
  );
}
