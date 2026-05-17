import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  buildClusterJsonLd,
  type ClusterArticle,
  type ClusterPageKind,
} from "./agency-content-cluster";
import { serializeJsonLd } from "./agency-seo.logic";

export function ClusterJsonLd({
  language,
  kind,
  article,
}: {
  language: AgencyLandingLanguage;
  kind: ClusterPageKind;
  article?: ClusterArticle;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(buildClusterJsonLd({ language, kind, article })),
      }}
    />
  );
}
