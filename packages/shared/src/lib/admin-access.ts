import { db } from "@webhealth/shared/db";
import { adminEmails } from "@webhealth/shared/db/schema";

export async function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const row = await db.query.adminEmails.findFirst({
    where: (table, { eq }) => eq(table.email, normalizedEmail),
    columns: { id: true },
  });

  return Boolean(row);
}

export async function listAdminEmails() {
  return db.query.adminEmails.findMany({
    columns: { email: true },
    orderBy: (table, { asc }) => [asc(table.email)],
  });
}

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
