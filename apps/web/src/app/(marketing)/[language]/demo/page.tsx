import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { AgencyLandingLanguage } from "../../agency-homepage.logic";
import { isAgencyLandingLanguage } from "../../agency-seo.logic";
import { DemoPageContent, buildDemoMetadata } from "../../demo/demo-page";

type LocalizedDemoPageProps = {
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
}: LocalizedDemoPageProps): Promise<Metadata> {
  const language = resolveLanguage((await params).language);
  return buildDemoMetadata(language);
}

export default async function LocalizedDemoPage({
  params,
}: LocalizedDemoPageProps) {
  const language = resolveLanguage((await params).language);

  return <DemoPageContent language={language} />;
}
