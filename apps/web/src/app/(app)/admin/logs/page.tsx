import { headers } from "next/headers";
import { LogsTable } from "./logs-table";

export default async function AdminLogsPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground text-sm">
          Admin syncs, background refreshes, AI insight runs, action changes, and snapshot activity.
        </p>
      </div>
      <LogsTable initialLogs={logs} />
    </div>
  );
}
