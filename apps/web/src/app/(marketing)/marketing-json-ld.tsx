import { buildMarketingSiteJsonLd, serializeJsonLd } from "./agency-seo.logic";

export function MarketingJsonLd() {
  return (
    <script
      id="marketing-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(buildMarketingSiteJsonLd()),
      }}
    />
  );
}
