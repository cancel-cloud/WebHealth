import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/server/authz";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
