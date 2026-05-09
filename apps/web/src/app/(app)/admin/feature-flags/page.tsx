import { headers } from "next/headers";
import { FlagsTable } from "./flags-table";

export default async function AdminFeatureFlagsPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";

  const [flagsRes, usersRes] = await Promise.all([
    fetch(`${process.env.BETTER_AUTH_URL}/api/admin/feature-flags`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }),
    fetch(`${process.env.BETTER_AUTH_URL}/api/admin/users`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const flagsData = await flagsRes.json();
  const usersData = await usersRes.json();

  const flags = flagsData.flags ?? [];
  const allUsers = (usersData.users ?? []).map((u: { id: string; name: string; email: string }) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <p className="text-muted-foreground text-sm">
          Toggle features globally or override per user. Click a row to manage per-user overrides.
        </p>
      </div>
      <FlagsTable flags={flags} allUsers={allUsers} />
    </div>
  );
}
