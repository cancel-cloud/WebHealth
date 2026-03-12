"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildLegalHref,
  LEGAL_DOCUMENT_IDS,
  LEGAL_NAV_LABELS,
  resolveLegalNavLocale,
} from "./legal-routes";

export function LegalFooterLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = resolveLegalNavLocale(pathname, searchParams.get("lang"));
  const labels = LEGAL_NAV_LABELS[locale];

  return (
    <>
      {LEGAL_DOCUMENT_IDS.map((documentId) => (
        <Link
          key={documentId}
          href={buildLegalHref(documentId, locale)}
          className="text-xs transition-colors hover:underline"
          style={{ color: "oklch(0.55 0.02 250)" }}
        >
          {labels[documentId]}
        </Link>
      ))}
    </>
  );
}
