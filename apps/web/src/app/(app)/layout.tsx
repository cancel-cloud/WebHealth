import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { db } from "@webhealth/shared/db";
import { eq } from "drizzle-orm";
import { isAdminEmail } from "@webhealth/shared/lib/admin-access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const userRecord = await db.query.user.findFirst({
    where: (u) => eq(u.id, session.user.id),
    columns: { isRestricted: true, restrictionMessage: true },
  });
  if (userRecord?.isRestricted) redirect("/settings");

  const isAdmin = await isAdminEmail(session.user.email ?? null);

  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdmin} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger aria-label="Toggle sidebar" className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
