import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getAppShellAccess } from "@/lib/server/app-shell";

export const metadata: Metadata = {
  title: "Settings — WebHealth",
};

export default async function SettingsFullLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await getAppShellAccess({ allowRestricted: true });

  return (
    <AppShell isAdmin={isAdmin}>
      <Suspense>{children}</Suspense>
    </AppShell>
  );
}
