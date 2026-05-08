import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import { buildAgencyJsonLd, type AgencySeoPage } from "./agency-seo.logic";

export function AgencyJsonLd({
  language,
  page,
}: {
  language: AgencyLandingLanguage;
  page: AgencySeoPage;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildAgencyJsonLd(language, page)),
      }}
    />
  );
}
