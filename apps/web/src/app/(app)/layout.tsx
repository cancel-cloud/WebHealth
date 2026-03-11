import { AppShell } from "@/components/app-shell";
import { getAppShellAccess } from "@/lib/server/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await getAppShellAccess();

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
