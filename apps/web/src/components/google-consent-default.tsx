import Script from "next/script";
import { buildGoogleConsentDefault } from "./cookie-consent.logic";

export function GoogleConsentDefault() {
  const consentDefault = buildGoogleConsentDefault();
  const script = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',${JSON.stringify(consentDefault)});`;
  return (
    <Script
      id="google-consent-default"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
