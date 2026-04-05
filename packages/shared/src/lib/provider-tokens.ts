import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";

const ENCRYPTION_PREFIX = "enc:v1";
const IV_LENGTH = 12;

function getEncryptionKey() {
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY is required for provider token encryption");
  }

  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32) return decoded;

  return createHash("sha256").update(raw).digest();
}

export function isEncryptedProviderToken(value: string | null | undefined) {
  return Boolean(value && value.startsWith(`${ENCRYPTION_PREFIX}:`));
}

export function encryptProviderToken(value: string | null | undefined) {
  if (!value) return null;
  if (isEncryptedProviderToken(value)) return value;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTION_PREFIX}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptProviderToken(value: string | null | undefined) {
  if (!value) return null;
  if (!isEncryptedProviderToken(value)) return value;

  const parts = value.split(":");
  if (parts.length !== 5) {
    throw new Error("Invalid encrypted provider token format");
  }

  const [, , ivPart, tagPart, dataPart] = parts;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export type GoogleAccountTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
};

export function decryptGoogleAccountTokens<T extends {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope?: string | null;
}>(row: T): T & GoogleAccountTokens {
  return {
    ...row,
    accessToken: decryptProviderToken(row.accessToken),
    refreshToken: decryptProviderToken(row.refreshToken),
    idToken: decryptProviderToken(row.idToken),
    scope: row.scope ?? null,
  };
}

export async function getGoogleAccountTokensForUser(userId: string) {
  const { db } = await import("@webhealth/shared/db");
  const googleAccount = await db.query.account.findFirst({
    where: (table, { and, eq }) => and(eq(table.userId, userId), eq(table.providerId, "google")),
  });

  if (!googleAccount) return null;
  return decryptGoogleAccountTokens(googleAccount);
}

export async function updateGoogleAccountTokens(
  userId: string,
  input: Partial<GoogleAccountTokens>
) {
  const [{ db }, { account }] = await Promise.all([
    import("@webhealth/shared/db"),
    import("@webhealth/shared/db/schema"),
  ]);
  const update: Partial<typeof account.$inferInsert> = {};
  if ("accessToken" in input) update.accessToken = encryptProviderToken(input.accessToken ?? null);
  if ("refreshToken" in input) update.refreshToken = encryptProviderToken(input.refreshToken ?? null);
  if ("idToken" in input) update.idToken = encryptProviderToken(input.idToken ?? null);
  if ("accessTokenExpiresAt" in input) update.accessTokenExpiresAt = input.accessTokenExpiresAt ?? null;
  if ("refreshTokenExpiresAt" in input) update.refreshTokenExpiresAt = input.refreshTokenExpiresAt ?? null;
  if ("scope" in input) update.scope = input.scope ?? null;

  if (Object.keys(update).length === 0) return;

  await db
    .update(account)
    .set(update)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")));
}

export async function backfillPlaintextGoogleTokens() {
  const { db } = await import("@webhealth/shared/db");
  const rows = await db.query.account.findMany({
    where: (table, { eq }) => eq(table.providerId, "google"),
  });

  for (const row of rows) {
    await updateGoogleAccountTokens(row.userId, {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      idToken: row.idToken,
      accessTokenExpiresAt: row.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: row.refreshTokenExpiresAt ?? null,
      scope: row.scope ?? null,
    });
  }
}
