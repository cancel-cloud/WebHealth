import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgencyJsonLd } from "../../agency-json-ld";
import { AgencySeoTopicPage } from "../../agency-seo-topic-page";
import { getLegalDictionary } from "../../legal/legal-dictionaries";
import { LegalDocumentPage } from "../../legal/legal-document-page";
import {
  AGENCY_SEO_TOPIC_SLUGS,
  buildAgencySeoTopicMetadata,
  isAgencyLandingLanguage,
} from "../../agency-seo.logic";
import {
  buildLegalMetadata,
  getLegalDocumentIdFromSlug,
  LEGAL_DOCUMENT_IDS,
} from "../../legal/legal";

type AgencySeoTopicRouteProps = {
  params: Promise<{ language: string; seoSlug: string }>;
};

export function generateStaticParams() {
  return [
    { language: "de", seoSlug: AGENCY_SEO_TOPIC_SLUGS.de },
    { language: "en", seoSlug: AGENCY_SEO_TOPIC_SLUGS.en },
    ...LEGAL_DOCUMENT_IDS.flatMap((documentId) => [
      { language: "de", seoSlug: documentId },
      { language: "en", seoSlug: documentId },
    ]),
  ];
}

function resolveLocalizedParams(params: {
  language: string;
  seoSlug: string;
}) {
  if (!isAgencyLandingLanguage(params.language)) notFound();
  const legalDocumentId = getLegalDocumentIdFromSlug(params.seoSlug);
  if (legalDocumentId) {
    return {
      type: "legal" as const,
      language: params.language,
      documentId: legalDocumentId,
    };
  }
  if (params.seoSlug === AGENCY_SEO_TOPIC_SLUGS[params.language]) {
    return { type: "topic" as const, language: params.language };
  }
  notFound();
}

export async function generateMetadata({
  params,
}: AgencySeoTopicRouteProps): Promise<Metadata> {
  const resolved = resolveLocalizedParams(await params);
  if (resolved.type === "legal") {
    return buildLegalMetadata(resolved.documentId, resolved.language);
  }
  return buildAgencySeoTopicMetadata(resolved.language);
}

export default async function AgencySeoTopicRoute({
  params,
}: AgencySeoTopicRouteProps) {
  const resolved = resolveLocalizedParams(await params);

  if (resolved.type === "legal") {
    const dictionary = await getLegalDictionary(resolved.language);
    return (
      <LegalDocumentPage
        documentId={resolved.documentId}
        locale={resolved.language}
        dictionary={dictionary}
      />
    );
  }

  const language = resolved.language;

  return (
    <>
      <AgencyJsonLd language={language} page="topic" />
      <AgencySeoTopicPage language={language} />
    </>
  );
}
