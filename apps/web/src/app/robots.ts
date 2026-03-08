import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo", "/privacy", "/terms"],
        disallow: ["/dashboard", "/reports", "/settings", "/properties", "/admin", "/api"],
      },
    ],
    sitemap: "https://webaudit-79.localcan.dev/sitemap.xml",
  };
}
