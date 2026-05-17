import type { MetadataRoute } from "next";
import {
  AGENCY_PRODUCTION_BASE_URL,
  getAgencyAboutPath,
  getAgencyDemoPath,
  getAgencyHomePath,
  getAgencyPricingPath,
  getAgencySeoTopicPath,
} from "./(marketing)/agency-seo.logic";
import {
  CLUSTER_ARTICLE_SLUGS,
  getAgencyResourcesPath,
  getClusterArticlePath,
} from "./(marketing)/agency-content-cluster";
import {
  buildLegalHref,
  LEGAL_DOCUMENT_IDS,
} from "./(marketing)/legal/legal-routes";

const BASE_URL = AGENCY_PRODUCTION_BASE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}${getAgencyHomePath("de")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}${getAgencyHomePath("en")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}${getAgencySeoTopicPath("de")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}${getAgencySeoTopicPath("en")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}${getAgencyAboutPath("de")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}${getAgencyAboutPath("en")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}${getAgencyPricingPath("de")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}${getAgencyPricingPath("en")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}${getAgencyDemoPath("de")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}${getAgencyDemoPath("en")}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}${getAgencyResourcesPath("de")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}${getAgencyResourcesPath("en")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...CLUSTER_ARTICLE_SLUGS.flatMap((slug) =>
      (["de", "en"] as const).map((locale) => ({
        url: `${BASE_URL}${getClusterArticlePath(locale, slug)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: locale === "de" ? 0.6 : 0.5,
      })),
    ),
    ...LEGAL_DOCUMENT_IDS.flatMap((documentId) =>
      (["en", "de"] as const).map((locale) => ({
        url: `${BASE_URL}${buildLegalHref(documentId, locale)}`,
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
    ),
  ];
}
