export type BrandNonBrandSplit = {
  branded: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  nonBranded: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  brandClickShare: number; // 0–1
};

type QueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function buildBrandTokens(domainName: string): string[] {
  const base = domainName.replace(/^www\./, "").replace(/\.[^.]+$/, "").toLowerCase();
  return base.split(/[-_\s]/).filter((t) => t.length > 2);
}

export function splitBrandNonBrand(queries: QueryRow[], domainName: string): BrandNonBrandSplit {
  const tokens = buildBrandTokens(domainName);

  const branded: QueryRow[] = [];
  const nonBranded: QueryRow[] = [];

  for (const row of queries) {
    const q = row.query.toLowerCase();
    const isBrand = tokens.some((t) => q.includes(t));
    if (isBrand) branded.push(row);
    else nonBranded.push(row);
  }

  const totalClicks = queries.reduce((s, r) => s + r.clicks, 0);
  const brandClicks = branded.reduce((s, r) => s + r.clicks, 0);

  return {
    branded,
    nonBranded,
    brandClickShare: totalClicks > 0 ? brandClicks / totalClicks : 0,
  };
}
