import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPageContent } from "../../about/about-page-content";
import type { AgencyLandingLanguage } from "../../agency-homepage.logic";
import {
  buildAgencyAboutMetadata,
  isAgencyLandingLanguage,
} from "../../agency-seo.logic";

type LocalizedAboutPageProps = {
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
}: LocalizedAboutPageProps): Promise<Metadata> {
  const language = resolveLanguage((await params).language);
  return buildAgencyAboutMetadata(language);
}

export default async function LocalizedAboutPage({
  params,
}: LocalizedAboutPageProps) {
  const language = resolveLanguage((await params).language);

  return <AboutPageContent language={language} />;
}
