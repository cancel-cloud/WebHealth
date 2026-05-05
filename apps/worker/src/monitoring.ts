import * as Sentry from "@sentry/node";
import {
  type BuildProductEventPayloadInput,
  buildPosthogErrorEventProperties,
} from "@webhealth/shared/lib/product-events";

type WorkerEnv = Record<string, string | undefined>;

type WorkerFailureContext = {
  phase: string;
  teamId?: string;
  userId?: string | null;
  [key: string]: unknown;
};

type ProductEventRecorder = (event: BuildProductEventPayloadInput) => void | Promise<void>;

function recordPosthogWorkerError(event: BuildProductEventPayloadInput, recorder?: ProductEventRecorder) {
  if (recorder) {
    void recorder(event);
    return;
  }

  void import("@webhealth/shared/lib/product-event-store")
    .then(({ recordProductEvent }) => recordProductEvent(event))
    .catch(() => {});
}

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
  productEventRecorder?: ProductEventRecorder,
) {
  const shouldReportToSentry = Boolean(env.SENTRY_DSN?.trim());

  if (shouldReportToSentry) {
    Sentry.withScope((scope) => {
      scope.setTag("error_surface", "worker");
      scope.setTag("worker_phase", context.phase);
      scope.setLevel("fatal");
      scope.setContext("worker_failure", context);
      Sentry.captureException(error);
    });
  }

  recordPosthogWorkerError({
    teamId: context.teamId ?? "internal_system",
    userId: context.userId ?? null,
    name: "worker_error_reported",
    source: "worker",
    entityType: "worker",
    entityId: context.phase,
    properties: buildPosthogErrorEventProperties({
      surface: "worker",
      message: error instanceof Error ? error.message : "Worker fatal error",
      context,
    }),
  }, productEventRecorder);

  if (shouldReportToSentry) {
    await Sentry.close(2000);
  }
}
