export type ManagedPropertySource = {
  id: string;
  teamId?: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  ga4PropertyId: string | null;
};

export type ManagedPropertyRow = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  linked: boolean;
  sourceLabel: "GSC" | "GA4";
  badgeLabel: "linked" | "setup";
  note: string;
  sourceIds: string[];
  searchText: string;
};

function ga4NumericId(property: Pick<ManagedPropertySource, "id">) {
  return property.id.replace(/^ga4_/, "");
}

function displayName(source: ManagedPropertySource) {
  return source.name?.trim() || source.url?.trim() || source.id;
}

function buildSearchText(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function isGscProperty(property: Pick<ManagedPropertySource, "id" | "type">) {
  return property.type === "gsc" || property.id.startsWith("gsc_");
}

function isGa4Property(property: Pick<ManagedPropertySource, "id" | "type">) {
  return property.type === "ga4" || property.id.startsWith("ga4_");
}

function gscCandidateRank(property: ManagedPropertySource) {
  let score = 0;
  if (property.url.startsWith("sc-domain:")) score += 100;
  if (property.ga4PropertyId) score += 20;
  if (property.url.startsWith("https://")) score += 5;
  if (property.url.startsWith("http://")) score += 1;
  return score;
}

function preferGscCandidate(next: ManagedPropertySource, current: ManagedPropertySource) {
  const nextRank = gscCandidateRank(next);
  const currentRank = gscCandidateRank(current);
  if (nextRank !== currentRank) return nextRank > currentRank;
  return next.id < current.id;
}

function activeLinkedRow(properties: ManagedPropertySource[], ga4: ManagedPropertySource) {
  return ga4.active && properties.some((property) => property.active);
}

export function buildManagedPropertyRows(properties: ManagedPropertySource[]): ManagedPropertyRow[] {
  const ga4ById = new Map(properties.filter(isGa4Property).map((property) => [property.id, property]));
  const linkedGscByGa4Id = new Map<string, ManagedPropertySource[]>();
  const linkedGa4Ids = new Set<string>();
  const rows: ManagedPropertyRow[] = [];

  for (const property of properties.filter(isGscProperty)) {
    const ga4 = property.ga4PropertyId ? ga4ById.get(`ga4_${property.ga4PropertyId}`) ?? null : null;
    if (ga4) {
      const current = linkedGscByGa4Id.get(ga4.id) ?? [];
      linkedGscByGa4Id.set(ga4.id, [...current, property]);
      continue;
    }

    rows.push({
      id: property.id,
      name: displayName(property),
      url: property.url,
      active: property.active,
      linked: false,
      sourceLabel: "GSC",
      badgeLabel: "setup",
      note: "Missing GA4. Keep this hidden until Analytics is linked for complete traffic context.",
      sourceIds: [property.id],
      searchText: buildSearchText([property.name, property.url, property.id, property.ga4PropertyId]),
    });
  }

  for (const [ga4Id, gscProperties] of linkedGscByGa4Id) {
    const ga4 = ga4ById.get(ga4Id);
    if (!ga4) continue;
    linkedGa4Ids.add(ga4.id);
    const canonicalGsc = gscProperties.reduce((best, next) =>
      preferGscCandidate(next, best) ? next : best,
    );
    const duplicateGscIds = gscProperties
      .filter((property) => property.id !== canonicalGsc.id)
      .map((property) => property.id)
      .sort();

    rows.push({
      id: `linked:${canonicalGsc.id}:${ga4.id}`,
      name: displayName(ga4),
      url: canonicalGsc.url,
      active: activeLinkedRow(gscProperties, ga4),
      linked: true,
      sourceLabel: "GA4",
      badgeLabel: "linked",
      note: "Linked activation enables the property dashboard. Paid plans can refresh the default 28-day data automatically and send source evidence to OpenAI for AI insights; Solo users press Re-run when they want fresh data and AI insights.",
      sourceIds: [canonicalGsc.id, ga4.id, ...duplicateGscIds],
      searchText: buildSearchText([
        ga4.name,
        ga4.url,
        ga4.id,
        ga4NumericId(ga4),
        ...gscProperties.flatMap((property) => [
          property.name,
          property.url,
          property.id,
          property.ga4PropertyId,
        ]),
      ]),
    });
  }

  for (const property of properties.filter(isGa4Property)) {
    if (linkedGa4Ids.has(property.id)) continue;
    rows.push({
      id: property.id,
      name: displayName(property),
      url: property.url,
      active: property.active,
      linked: false,
      sourceLabel: "GA4",
      badgeLabel: "setup",
      note: "Missing Search Console. Keep this hidden until GSC is linked for ranked actions and complete data.",
      sourceIds: [property.id],
      searchText: buildSearchText([property.name, property.url, property.id, ga4NumericId(property)]),
    });
  }

  return rows.sort((a, b) => {
    if (a.linked !== b.linked) return a.linked ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function filterManagedPropertyRows(rows: ManagedPropertyRow[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => row.searchText.includes(normalized));
}

export function getManagedPropertyToggleTargets(row: ManagedPropertyRow) {
  return row.sourceIds;
}
