export type PositionBucket = "1-3" | "4-10" | "11-20" | "21-50" | "51+";

export type PositionBucketRow = {
  bucket: PositionBucket;
  impressionsCurrent: number;
  impressionsCompare: number;
  clicksCurrent: number;
  clicksCompare: number;
  ctrCurrent: number;
  ctrCompare: number;
  impressionsDelta: number;
  clicksDelta: number;
};

export type SegmentSummaryRow = {
  segmentType: "device" | "country";
  segmentValue: string;
  impressionsCurrent: number;
  clicksCurrent: number;
  ctrCurrent: number;
  impressionsDelta: number;
  clicksDelta: number;
};

function getBucket(position: number): PositionBucket {
  if (position <= 3) return "1-3";
  if (position <= 10) return "4-10";
  if (position <= 20) return "11-20";
  if (position <= 50) return "21-50";
  return "51+";
}

type QueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

const BUCKET_ORDER: PositionBucket[] = ["1-3", "4-10", "11-20", "21-50", "51+"];

export function buildPositionBuckets(
  currentQueries: QueryRow[],
  compareQueries: QueryRow[]
): PositionBucketRow[] {
  type BucketAccum = { impressions: number; clicks: number; count: number };
  const currentBuckets = new Map<PositionBucket, BucketAccum>();
  const compareBuckets = new Map<PositionBucket, BucketAccum>();

  for (const b of BUCKET_ORDER) {
    currentBuckets.set(b, { impressions: 0, clicks: 0, count: 0 });
    compareBuckets.set(b, { impressions: 0, clicks: 0, count: 0 });
  }

  for (const q of currentQueries) {
    const b = getBucket(q.position);
    const acc = currentBuckets.get(b)!;
    acc.impressions += q.impressions;
    acc.clicks += q.clicks;
    acc.count++;
  }

  for (const q of compareQueries) {
    const b = getBucket(q.position);
    const acc = compareBuckets.get(b)!;
    acc.impressions += q.impressions;
    acc.clicks += q.clicks;
    acc.count++;
  }

  return BUCKET_ORDER.map((bucket) => {
    const cur = currentBuckets.get(bucket)!;
    const cmp = compareBuckets.get(bucket)!;
    return {
      bucket,
      impressionsCurrent: cur.impressions,
      impressionsCompare: cmp.impressions,
      clicksCurrent: cur.clicks,
      clicksCompare: cmp.clicks,
      ctrCurrent: cur.impressions > 0 ? cur.clicks / cur.impressions : 0,
      ctrCompare: cmp.impressions > 0 ? cmp.clicks / cmp.impressions : 0,
      impressionsDelta: cur.impressions - cmp.impressions,
      clicksDelta: cur.clicks - cmp.clicks,
    };
  });
}

export function buildSegmentSummaryRows(params: {
  currentDevices: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>;
  compareDevices: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>;
  currentCountries: Array<{ country: string; clicks: number; impressions: number; ctr: number; position: number }>;
  compareCountries: Array<{ country: string; clicks: number; impressions: number; ctr: number; position: number }>;
}): SegmentSummaryRow[] {
  const rows: SegmentSummaryRow[] = [];

  const compareDeviceMap = new Map(params.compareDevices.map((d) => [d.device, d]));
  const topDevices = [...params.currentDevices].sort((a, b) => b.impressions - a.impressions).slice(0, 3);
  for (const d of topDevices) {
    const cmp = compareDeviceMap.get(d.device);
    rows.push({
      segmentType: "device",
      segmentValue: d.device,
      impressionsCurrent: d.impressions,
      clicksCurrent: d.clicks,
      ctrCurrent: d.ctr,
      impressionsDelta: d.impressions - (cmp?.impressions ?? 0),
      clicksDelta: d.clicks - (cmp?.clicks ?? 0),
    });
  }

  const compareCountryMap = new Map(params.compareCountries.map((c) => [c.country, c]));
  const topCountries = [...params.currentCountries].sort((a, b) => b.impressions - a.impressions).slice(0, 3);
  for (const c of topCountries) {
    const cmp = compareCountryMap.get(c.country);
    rows.push({
      segmentType: "country",
      segmentValue: c.country,
      impressionsCurrent: c.impressions,
      clicksCurrent: c.clicks,
      ctrCurrent: c.ctr,
      impressionsDelta: c.impressions - (cmp?.impressions ?? 0),
      clicksDelta: c.clicks - (cmp?.clicks ?? 0),
    });
  }

  return rows;
}
