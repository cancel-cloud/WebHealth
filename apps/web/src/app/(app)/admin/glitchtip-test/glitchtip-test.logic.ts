export type GlitchTipTestStatus = {
  configured: boolean;
  dsn: string | null;
  environment: string | null;
  release: string | null;
};

function normalizeEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getGlitchTipTestStatus(env: {
  NEXT_PUBLIC_SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
}): GlitchTipTestStatus {
  const dsn = normalizeEnvValue(env.NEXT_PUBLIC_SENTRY_DSN);

  return {
    configured: Boolean(dsn),
    dsn,
    environment: normalizeEnvValue(env.SENTRY_ENVIRONMENT),
    release: normalizeEnvValue(env.SENTRY_RELEASE),
  };
}
