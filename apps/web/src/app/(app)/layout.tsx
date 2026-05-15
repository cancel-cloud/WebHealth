import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getAppShellAccess } from "@/lib/server/app-shell";

export const metadata: Metadata = {
  title: "Dashboard — WebHealth",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, language } = await getAppShellAccess();

  return <AppShell isAdmin={isAdmin} language={language}>{children}</AppShell>;
}
