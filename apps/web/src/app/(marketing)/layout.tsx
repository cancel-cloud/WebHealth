import { MarketingShell } from "./marketing-shell";
import { MarketingJsonLd } from "./marketing-json-ld";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingJsonLd />
      <MarketingShell>{children}</MarketingShell>
    </>
  );
}
