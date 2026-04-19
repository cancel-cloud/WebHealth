import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const isDevelopment = process.env.NODE_ENV !== "production";

function getConfiguredDevOriginHost() {
  const value = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

const allowedDevOrigins = Array.from(
  new Set(
    [
      getConfiguredDevOriginHost(),
      "webaudit-25.localcan.dev",
      "webaudit-48.localcan.dev",
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https:`,
  "connect-src 'self' https:",
].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins,
  transpilePackages: ["@webhealth/shared"],
  turbopack: {
    root: repoRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  telemetry: false,
  silent: true,
  sourcemaps: {
    disable: true,
  },
});
