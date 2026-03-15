import { buildGoogleConsentDefault } from "./cookie-consent.logic";

export function GoogleConsentDefault() {
  const consentDefault = buildGoogleConsentDefault();
  const script = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',${JSON.stringify(consentDefault)});`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
