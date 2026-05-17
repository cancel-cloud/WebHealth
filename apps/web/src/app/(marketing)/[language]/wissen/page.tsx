import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClusterJsonLd } from "../../cluster-json-ld";
import { ClusterHubPage } from "../../cluster-pages";
import { buildClusterHubMetadata } from "../../agency-content-cluster";
import type { AgencyLandingLanguage } from "../../agency-homepage.logic";

type PageProps = {
  params: Promise<{ language: string }>;
};

export function generateStaticParams() {
  return [{ language: "de" }];
}

function resolveLanguage(language: string): AgencyLandingLanguage {
  if (language !== "de") notFound();
  return "de";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildClusterHubMetadata(resolveLanguage((await params).language));
}

export default async function GermanKnowledgeHub({ params }: PageProps) {
  const language = resolveLanguage((await params).language);

  return (
    <>
      <ClusterJsonLd language={language} kind="hub" />
      <ClusterHubPage language={language} />
    </>
  );
}
