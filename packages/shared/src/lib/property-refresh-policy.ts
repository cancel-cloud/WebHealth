import { createHash } from "crypto";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";
import type { SiteChanges } from "@webhealth/shared/lib/action-types";

export type PropertyRefreshTriggerSource = "manual" | "automation";
export type PropertyRefreshClaimLane = PropertyRefreshTriggerSource | "all";

export type PropertyRefreshPayload = {
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  triggerSource?: string | null;
};

export function matchesPropertyRefreshPayload(
  candidate: Record<string, unknown> | null | undefined,
  target: PropertyRefreshPayload | null | undefined,
) {
  const normalize = (value: unknown) => (typeof value === "string" && value.length ? value : null);

  return normalize(candidate?.preset) === normalize(target?.preset)
    && normalize(candidate?.compareMode) === normalize(target?.compareMode)
    && normalize(candidate?.startDate) === normalize(target?.startDate)
    && normalize(candidate?.endDate) === normalize(target?.endDate);
}

export function getPropertyRefreshTriggerSource(payload: Record<string, unknown> | null | undefined): PropertyRefreshTriggerSource {
  const value = typeof payload?.triggerSource === "string" ? payload.triggerSource : null;
  return value === "automation" || value === "scheduler" ? "automation" : "manual";
}

export function shouldSupersedePropertyRefreshJob(input: {
  incomingSource: PropertyRefreshTriggerSource;
  existingSource: PropertyRefreshTriggerSource;
}) {
  if (input.incomingSource === "manual") return true;
  return input.existingSource === "automation";
}

export function getPropertyRefreshClaimFilter(lane: PropertyRefreshClaimLane) {
  return (payload: Record<string, unknown> | null | undefined) => {
    if (lane === "all") return true;
    return getPropertyRefreshTriggerSource(payload) === lane;
  };
}

export type PropertyPageRegistryInput = {
  id: string;
  canonicalUrl: string;
  currentFingerprintHash: string;
  isActive: boolean;
  lastChangedAt: Date | null;
};

type CrawlPageForRegistry = CrawlResult["pages"][number];

type RegistryUpsert = {
  registryId: string | null;
  canonicalUrl: string;
  currentFingerprintHash: string;
  isNew: boolean;
  isChanged: boolean;
};

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function buildPropertyPageFingerprint(page: CrawlPageForRegistry) {
  const canonicalUrl = normalizeWhitespace(page.canonicalUrl || page.url || "");
  return sha256(
    JSON.stringify({
      url: canonicalUrl,
      title: normalizeWhitespace(page.title ?? ""),
      metaDescription: normalizeWhitespace(page.metaDescription ?? ""),
      h1Texts: (page.h1Texts ?? []).map((h) => normalizeWhitespace(h)).filter(Boolean),
      text: normalizeWhitespace(page.visibleTextExcerpt ?? ""),
    }),
  );
}

export function buildPropertyPageRegistryChanges(input: {
  existing: PropertyPageRegistryInput[];
  pages: CrawlPageForRegistry[];
  fingerprintPage?: (page: CrawlPageForRegistry) => string;
}): {
  siteChanges: SiteChanges;
  upserts: RegistryUpsert[];
  removedIds: string[];
} {
  const fingerprintPage = input.fingerprintPage ?? buildPropertyPageFingerprint;
  const registryByCanonical = new Map(input.existing.map((row) => [row.canonicalUrl, row]));
  const activeRegistryRows = input.existing.filter((row) => row.isActive);
  const seenCanonicalUrls = new Set<string>();
  const upserts: RegistryUpsert[] = [];
  const siteChanges: SiteChanges = { newPages: [], changedPages: [], removedPages: [] };

  for (const page of input.pages) {
    const canonicalUrl = (page.canonicalUrl || page.url || "").trim();
    if (!canonicalUrl || seenCanonicalUrls.has(canonicalUrl)) continue;
    seenCanonicalUrls.add(canonicalUrl);

    const nextFingerprint = fingerprintPage(page);
    const registry = registryByCanonical.get(canonicalUrl);
    const isNew = !registry || !registry.isActive;
    const isChanged = Boolean(registry && registry.currentFingerprintHash !== nextFingerprint);

    if (isNew) {
      siteChanges.newPages.push({ url: canonicalUrl });
    } else if (isChanged) {
      siteChanges.changedPages.push({
        url: canonicalUrl,
        changedFields: ["seoFingerprint"],
        machineDiffSummary: "SEO-relevant page fingerprint changed.",
      });
    }

    upserts.push({
      registryId: registry?.id ?? null,
      canonicalUrl,
      currentFingerprintHash: nextFingerprint,
      isNew,
      isChanged,
    });
  }

  const removedRows = activeRegistryRows.filter((row) => !seenCanonicalUrls.has(row.canonicalUrl));
  siteChanges.removedPages = removedRows.map((row) => ({ url: row.canonicalUrl }));

  return {
    siteChanges,
    upserts,
    removedIds: removedRows.map((row) => row.id),
  };
}
