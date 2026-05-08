import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgencyHomepageClient } from "../agency-homepage-client";
import { AgencyJsonLd } from "../agency-json-ld";
import type { AgencyLandingLanguage } from "../agency-homepage.logic";
import {
  buildAgencyHomeMetadata,
  isAgencyLandingLanguage,
} from "../agency-seo.logic";

type LocalizedAgencyPageProps = {
  params: Promise<{ language: string }>;
};

export function generateStaticParams() {
  return [{ language: "de" }, { language: "en" }];
}

function resolveLanguage(language: string): AgencyLandingLanguage {
  if (!isAgencyLandingLanguage(language)) notFound();
  return language;
}

export async function generateMetadata({
  params,
}: LocalizedAgencyPageProps): Promise<Metadata> {
  const language = resolveLanguage((await params).language);
  return buildAgencyHomeMetadata(language);
}

export default async function LocalizedAgencyPage({
  params,
}: LocalizedAgencyPageProps) {
  const language = resolveLanguage((await params).language);

  return (
    <>
      <AgencyJsonLd language={language} page="home" />
      <AgencyHomepageClient initialLanguage={language} />
    </>
  );
}
