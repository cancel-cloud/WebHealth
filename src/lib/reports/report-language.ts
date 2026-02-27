import { db } from "@/db";

export type ReportLanguageResolution = {
  language: string;
  source: "user_setting" | "google_locale" | "default";
};

const DEFAULT_LANGUAGE = "de";

function normalizeLanguageTag(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (!normalized) return null;
  const [base] = normalized.split("-");
  return base || null;
}

function extractGoogleLocaleFromIdToken(idToken: string | null | undefined) {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      locale?: string;
      lang?: string;
    };
    return normalizeLanguageTag(payload.locale ?? payload.lang ?? null);
  } catch {
    return null;
  }
}

export async function resolveReportLanguage(params: {
  userId: string;
  googleIdToken?: string | null;
}): Promise<ReportLanguageResolution> {
  const settings = await db.query.userSettings.findFirst({
    where: (s, { eq }) => eq(s.userId, params.userId),
    columns: { reportLanguage: true },
  });

  const userSetting = normalizeLanguageTag(settings?.reportLanguage ?? null);
  if (userSetting && userSetting !== "auto") {
    return { language: userSetting, source: "user_setting" };
  }

  const googleLocale = extractGoogleLocaleFromIdToken(params.googleIdToken);
  if (googleLocale) {
    return { language: googleLocale, source: "google_locale" };
  }

  return { language: DEFAULT_LANGUAGE, source: "default" };
}
