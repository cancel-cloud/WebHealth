import { headers } from "next/headers";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm">
          All registered users with their team and property usage.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
