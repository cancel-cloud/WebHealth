const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return (
    LOCALHOST_HOSTS.has(normalized) ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  );
}

export function shouldAllowHttpUrlForRuntime(hostname: string) {
  return process.env.NODE_ENV !== "production" && isLocalHostname(hostname);
}

export function sanitizeHttpUrl(
  value: string,
  options?: {
    allowHttp?: boolean;
    baseUrl?: string;
  }
): string | null {
  if (!value || typeof value !== "string") return null;

  try {
    const url = options?.baseUrl ? new URL(value, options.baseUrl) : new URL(value);
    const protocol = url.protocol.toLowerCase();
    const normalizedHostname = url.hostname.trim().toLowerCase();

    if (protocol === "https:") {
      return url.toString();
    }

    const allowHttp = options?.allowHttp ?? shouldAllowHttpUrlForRuntime(normalizedHostname);
    if (protocol === "http:" && allowHttp) {
      return url.toString();
    }

    return null;
  } catch {
    return null;
  }
}

export function sanitizeHttpUrls(
  values: readonly string[],
  options?: {
    allowHttp?: boolean;
    baseUrl?: string;
  }
) {
  const sanitized = new Set<string>();

  for (const value of values) {
    const next = sanitizeHttpUrl(value, options);
    if (next) sanitized.add(next);
  }

  return Array.from(sanitized);
}
