import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { isAdminEmail } from "@webhealth/shared/lib/admin-access";

export async function getAppShellAccess({
  allowRestricted = false,
}: {
  allowRestricted?: boolean;
} = {}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  if (!allowRestricted) {
    const userRecord = await db.query.user.findFirst({
      where: (user) => eq(user.id, session.user.id),
      columns: { isRestricted: true },
    });

    if (userRecord?.isRestricted) {
      redirect("/settings");
    }
  }

  return {
    isAdmin: await isAdminEmail(session.user.email ?? null),
  };
}
