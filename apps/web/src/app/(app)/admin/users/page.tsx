import { headers } from "next/headers";
import { UsersTable } from "./users-table";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function AdminUsersPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].users;
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
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
