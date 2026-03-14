import { db } from "@webhealth/shared/db";
import { adminEmails } from "@webhealth/shared/db/schema";
import { withCache } from "@webhealth/shared/lib/simple-cache";

export async function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const row = await db.query.adminEmails.findFirst({
    where: (table, { eq }) => eq(table.email, normalizedEmail),
    columns: { id: true },
  });

  return Boolean(row);
}

const _listAdminEmails = () =>
  db.query.adminEmails.findMany({
    columns: { email: true },
    orderBy: (table, { asc }) => [asc(table.email)],
  });

export const listAdminEmails = withCache(_listAdminEmails, 5 * 60 * 1000);

export async function ensureAdminEmail(email: string, createdByUserId?: string | null) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  await db
    .insert(adminEmails)
    .values({
      id: `admin_${normalizedEmail}`,
      email: normalizedEmail,
      createdByUserId: createdByUserId ?? null,
    })
    .onConflictDoNothing({ target: adminEmails.email });
}
