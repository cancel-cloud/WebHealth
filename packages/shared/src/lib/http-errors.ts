export class HttpError extends Error {
  status: number;
  code: string;
  safeMessage: string;

  constructor(status: number, code: string, safeMessage: string, internalMessage?: string) {
    super(internalMessage ?? safeMessage);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.safeMessage = safeMessage;
  }
}

export function badRequest(code: string, message: string) {
  return new HttpError(400, code, message);
}

export function unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
  return new HttpError(401, code, message);
}

export function forbidden(message = "Forbidden", code = "FORBIDDEN") {
  return new HttpError(403, code, message);
}

export function notFound(message = "Not found", code = "NOT_FOUND") {
  return new HttpError(404, code, message);
}

export function conflict(message = "Conflict", code = "CONFLICT") {
  return new HttpError(409, code, message);
}

export function tooManyRequests(message = "Too many requests", code = "RATE_LIMITED") {
  return new HttpError(429, code, message);
}

export function toPublicError(error: unknown, fallback = "Internal server error") {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: error.safeMessage,
        code: error.code,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: fallback,
      code: "INTERNAL_SERVER_ERROR",
    },
  };
}
