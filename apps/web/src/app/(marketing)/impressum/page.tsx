import type { Metadata } from "next";
import { getLegalDictionary } from "../legal/legal-dictionaries";
import { LegalDocumentPage } from "../legal/legal-document-page";
import { buildLegalMetadata, resolveLegalLocale } from "../legal/legal";

type LegalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: LegalPageProps): Promise<Metadata> {
  const locale = resolveLegalLocale((await searchParams).lang);
  return buildLegalMetadata("impressum", locale);
}

export default async function ImpressumPage({ searchParams }: LegalPageProps) {
  const locale = resolveLegalLocale((await searchParams).lang);
  const dictionary = await getLegalDictionary(locale);

  return (
    <LegalDocumentPage
      documentId="impressum"
      locale={locale}
      dictionary={dictionary}
    />
  );
}
