import type { MetadataRoute } from "next";
import { AGENCY_PRODUCTION_BASE_URL } from "./(marketing)/agency-seo.logic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/de",
          "/en",
          "/de/seo-reporting-tool-agenturen",
          "/en/seo-reporting-software-agencies",
          "/about",
          "/pricing",
          "/privacy",
          "/terms",
          "/impressum",
          "/dpa",
        ],
        disallow: ["/dashboard", "/settings", "/properties", "/admin", "/api"],
      },
    ],
    sitemap: `${AGENCY_PRODUCTION_BASE_URL}/sitemap.xml`,
  };
}
