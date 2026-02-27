import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["webaudit-79.localcan.dev"],
  transpilePackages: ["@webhealth/shared"],
};

export default nextConfig;
