import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClusterJsonLd } from "../../../cluster-json-ld";
import { ClusterArticlePage } from "../../../cluster-pages";
import {
  CLUSTER_ARTICLE_SLUGS,
  buildClusterArticleMetadata,
  getClusterArticle,
} from "../../../agency-content-cluster";
import type { AgencyLandingLanguage } from "../../../agency-homepage.logic";

type PageProps = {
  params: Promise<{ language: string; articleSlug: string }>;
};

export function generateStaticParams() {
  return CLUSTER_ARTICLE_SLUGS.map((articleSlug) => ({
    language: "de",
    articleSlug,
  }));
}

function resolveParams(params: { language: string; articleSlug: string }) {
  if (params.language !== "de") notFound();
  const article = getClusterArticle(params.articleSlug);
  if (!article) notFound();

  return { language: "de" as AgencyLandingLanguage, article };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = resolveParams(await params);
  return buildClusterArticleMetadata(resolved.language, resolved.article);
}

export default async function GermanKnowledgeArticle({ params }: PageProps) {
  const resolved = resolveParams(await params);

  return (
    <>
      <ClusterJsonLd
        language={resolved.language}
        kind="article"
        article={resolved.article}
      />
      <ClusterArticlePage language={resolved.language} article={resolved.article} />
    </>
  );
}
