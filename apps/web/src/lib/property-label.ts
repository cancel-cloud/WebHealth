/**
 * Returns a human-readable label for a property ID stored in the DB.
 * Handles: "gsc_" prefix, "sc-domain:" prefix, and plain URL formats.
 */
export function propertyIdLabel(propertyId: string): string {
  let raw = propertyId;

  // Strip worker/DB prefix
  if (raw.startsWith("gsc_")) {
    raw = raw.slice(4);
  }

  // Strip GSC domain-property prefix
  if (raw.startsWith("sc-domain:")) {
    return raw.slice("sc-domain:".length);
  }

  // Strip URL scheme / trailing slash
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return path === "/" ? host : `${host}${path}`;
  } catch {
    return raw;
  }
}
