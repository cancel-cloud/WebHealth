import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsFullLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  return <Suspense>{children}</Suspense>;
}
