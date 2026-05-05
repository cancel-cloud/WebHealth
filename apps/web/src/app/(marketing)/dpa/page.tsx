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
  return buildLegalMetadata("dpa", locale);
}

export default async function DpaPage({ searchParams }: LegalPageProps) {
  const locale = resolveLegalLocale((await searchParams).lang);
  const dictionary = await getLegalDictionary(locale);

  return (
    <LegalDocumentPage
      documentId="dpa"
      locale={locale}
      dictionary={dictionary}
    />
  );
}
