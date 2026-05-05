export function isDowngrade(oldMax: number | null, newMax: number | null): boolean {
  if (newMax === null) return false;
  if (oldMax === null) return true;
  return newMax < oldMax;
}

export type CullingPropertyRow = {
  id: string;
  type: string;
  ga4PropertyId: string | null;
  active: boolean;
  createdAt: Date;
};

type LinkedGroup = {
  ga4Id: string;
  ga4PropertyId: string;
  gscIds: string[];
  groupCreatedAt: Date;
};

export function buildDeactivationPlan(input: {
  properties: CullingPropertyRow[];
  maxAllowed: number;
}): { deactivatedPropertyIds: string[]; deactivatedGroupCount: number } {
  const ga4ById = new Map<string, CullingPropertyRow>();
  const activeGscRows: CullingPropertyRow[] = [];

  for (const p of input.properties) {
    if (p.type === "ga4") ga4ById.set(p.id, p);
    if (p.type === "gsc" && p.active && p.ga4PropertyId) activeGscRows.push(p);
  }

  const groups: LinkedGroup[] = [];
  const seenGa4Ids = new Set<string>();

  for (const gsc of activeGscRows) {
    const ga4Id = gsc.ga4PropertyId!;
    if (seenGa4Ids.has(ga4Id)) continue;

    const ga4Key = `ga4_${ga4Id}`;
    const ga4 = ga4ById.get(ga4Key);
    if (!ga4?.active) continue;

    const linkedGscRows = activeGscRows.filter((r) => r.ga4PropertyId === ga4Id);
    const gscIds = linkedGscRows.map((r) => r.id);

    seenGa4Ids.add(ga4Id);

    const timestamps = [ga4.createdAt.getTime(), ...linkedGscRows.map((r) => r.createdAt.getTime())];
    const groupCreatedAt = new Date(Math.max(...timestamps));

    groups.push({ ga4Id, ga4PropertyId: ga4Key, gscIds, groupCreatedAt });
  }

  groups.sort((a, b) => {
    const diff = a.groupCreatedAt.getTime() - b.groupCreatedAt.getTime();
    if (diff !== 0) return diff;
    return a.ga4Id.localeCompare(b.ga4Id);
  });

  if (groups.length <= input.maxAllowed) {
    return { deactivatedPropertyIds: [], deactivatedGroupCount: 0 };
  }

  const excess = groups.slice(input.maxAllowed);
  const deactivatedPropertyIds: string[] = [];

  for (const group of excess) {
    deactivatedPropertyIds.push(group.ga4PropertyId, ...group.gscIds);
  }

  return { deactivatedPropertyIds, deactivatedGroupCount: excess.length };
}