import * as Sentry from "@sentry/node";

type WorkerEnv = Record<string, string | undefined>;

type WorkerFailureContext = {
  phase: string;
  [key: string]: unknown;
};

export function initWorkerMonitoring(env: WorkerEnv = process.env) {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: true,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export async function reportWorkerFatalError(
  error: unknown,
  context: WorkerFailureContext,
  env: WorkerEnv = process.env,
) {
  if (!env.SENTRY_DSN?.trim()) return;

  Sentry.withScope((scope) => {
    scope.setTag("error_surface", "worker");
    scope.setTag("worker_phase", context.phase);
    scope.setLevel("fatal");
    scope.setContext("worker_failure", context);
    Sentry.captureException(error);
  });

  await Sentry.close(2000);
}
