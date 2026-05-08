import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgencyJsonLd } from "../../agency-json-ld";
import { AgencySeoTopicPage } from "../../agency-seo-topic-page";
import type { AgencyLandingLanguage } from "../../agency-homepage.logic";
import {
  AGENCY_SEO_TOPIC_SLUGS,
  buildAgencySeoTopicMetadata,
  isAgencyLandingLanguage,
} from "../../agency-seo.logic";

type AgencySeoTopicRouteProps = {
  params: Promise<{ language: string; seoSlug: string }>;
};

export function generateStaticParams() {
  return [
    { language: "de", seoSlug: AGENCY_SEO_TOPIC_SLUGS.de },
    { language: "en", seoSlug: AGENCY_SEO_TOPIC_SLUGS.en },
  ];
}

function resolveTopicParams(params: {
  language: string;
  seoSlug: string;
}): AgencyLandingLanguage {
  if (!isAgencyLandingLanguage(params.language)) notFound();
  if (params.seoSlug !== AGENCY_SEO_TOPIC_SLUGS[params.language]) notFound();
  return params.language;
}

export async function generateMetadata({
  params,
}: AgencySeoTopicRouteProps): Promise<Metadata> {
  const language = resolveTopicParams(await params);
  return buildAgencySeoTopicMetadata(language);
}

export default async function AgencySeoTopicRoute({
  params,
}: AgencySeoTopicRouteProps) {
  const language = resolveTopicParams(await params);

  return (
    <>
      <AgencyJsonLd language={language} page="topic" />
      <AgencySeoTopicPage language={language} />
    </>
  );
}
