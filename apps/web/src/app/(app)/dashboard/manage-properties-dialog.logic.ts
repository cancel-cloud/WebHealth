export type ManagedPropertySource = {
  id: string;
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

export function buildManagedPropertyRows(properties: ManagedPropertySource[]): ManagedPropertyRow[] {
  const ga4ById = new Map(properties.filter((property) => property.type === "ga4").map((property) => [property.id, property]));
  const linkedGa4Ids = new Set<string>();
  const rows: ManagedPropertyRow[] = [];

  for (const property of properties.filter((item) => item.type === "gsc")) {
    const ga4 = property.ga4PropertyId ? ga4ById.get(`ga4_${property.ga4PropertyId}`) ?? null : null;
    if (ga4) {
      linkedGa4Ids.add(ga4.id);
      rows.push({
        id: `linked:${property.id}:${ga4.id}`,
        name: displayName(ga4),
        url: property.url,
        active: property.active && ga4.active,
        linked: true,
        sourceLabel: "GA4",
        badgeLabel: "linked",
        note: "Ready through its linked Search Console property.",
        sourceIds: [property.id, ga4.id],
        searchText: buildSearchText([ga4.name, ga4.url, ga4.id, property.name, property.url, property.id, property.ga4PropertyId]),
      });
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

  for (const property of properties.filter((item) => item.type === "ga4")) {
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
