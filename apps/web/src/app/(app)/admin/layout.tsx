import { auth } from "@webhealth/shared/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (session.user.email !== ADMIN_EMAIL) redirect("/dashboard");
  return <>{children}</>;
}
