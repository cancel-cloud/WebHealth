import { headers } from "next/headers";
import { SyncUsersTable } from "./users-table";

export default async function AdminSyncingPage() {
  const res = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/admin/users`,
    {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
      cache: "no-store",
    }
  );
  const data = await res.json();
  const users = data.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Syncing</h1>
        <p className="text-muted-foreground text-sm">
          Manually trigger Google property sync for any user.
        </p>
      </div>
      <SyncUsersTable users={users} />
    </div>
  );
}
