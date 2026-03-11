type AppErrorOptions = {
  code?: string | null;
  status?: number | null;
  handled?: boolean;
  cause?: unknown;
};

export class AppError extends Error {
  code: string | null;
  status: number | null;
  handled: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = typeof options.code === "string" ? options.code : null;
    this.status = typeof options.status === "number" ? options.status : null;
    this.handled = options.handled ?? false;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getAppErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
