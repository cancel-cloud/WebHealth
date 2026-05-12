import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { buildLegalMetadata, getLegacyLegalRedirectPath } from "../legal/legal";

type LegalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: LegalPageProps): Promise<Metadata> {
  const params = await searchParams;
  return buildLegalMetadata("privacy", params.lang === "de" ? "de" : "en");
}

export default async function PrivacyPage({ searchParams }: LegalPageProps) {
  permanentRedirect(getLegacyLegalRedirectPath("privacy", (await searchParams).lang));
}
