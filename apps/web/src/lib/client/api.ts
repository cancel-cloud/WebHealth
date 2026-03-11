import { AppError } from "./app-error";
import { reportClientError } from "./report-error";

type RequestJsonDeps = {
  fetcher: typeof fetch;
  reportError: typeof reportClientError;
};

type ErrorPayloadShape = {
  error?: unknown;
  code?: unknown;
  message?: unknown;
};

function getRequestPath(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return String(input);
}

async function parseJsonBody(response: Response) {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    throw new AppError("Received an invalid JSON response.", {
      code: "INVALID_JSON_RESPONSE",
      status: response.status,
      handled: false,
      cause,
    });
  }
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function looksLikeErrorCode(value: string | null): boolean {
  return Boolean(value && /^[A-Z0-9_]+$/.test(value));
}

function appErrorFromPayload(payload: unknown, status: number): AppError | null {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as ErrorPayloadShape;
  const code = getString(source.code);
  const error = getString(source.error);
  const message = getString(source.message);

  if (!code && !error && !message) return null;

  return new AppError(message ?? error ?? "Request failed", {
    code: code ?? (looksLikeErrorCode(error) ? error : null),
    status,
    handled: true,
    cause: payload,
  });
}

export async function requestJsonWith<T>(
  deps: RequestJsonDeps,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T | null> {
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  const path = getRequestPath(input);

  try {
    const response = await deps.fetcher(input, init);
    const data = await parseJsonBody(response);

    if (!response.ok) {
      throw (
        appErrorFromPayload(data, response.status) ??
        new AppError("Request failed", {
          code: null,
          status: response.status,
          handled: false,
          cause: data,
        })
      );
    }

    return data as T | null;
  } catch (error) {
    if (!(error instanceof AppError && error.handled)) {
      deps.reportError(error, { method, path });
    }
    throw error;
  }
}

export function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  return requestJsonWith<T>(
    {
      fetcher: fetch,
      reportError: reportClientError,
    },
    input,
    init,
  );
}
