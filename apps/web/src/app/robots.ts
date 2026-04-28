import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo", "/pricing", "/privacy", "/terms", "/impressum"],
        disallow: ["/dashboard", "/settings", "/properties", "/admin", "/api"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev"}/sitemap.xml`,
  };
}
