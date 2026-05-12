import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/server/authz";

export const metadata: Metadata = {
  title: "Admin — WebHealth",
};

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
