import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { crawlPageSnapshots, propertyPageRegistry } from "@/db/schema";
import type { SiteChanges } from "@/lib/reports/types";

export type PageFingerprintInput = {
  url: string;
  title?: string | null;
  metaDescription?: string | null;
  h1Texts?: string[] | null;
  text?: string | null;
};

export type MachinePageDiff = {
  changedFields: string[];
  machineDiffSummary: string;
};

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function buildPageFingerprints(input: PageFingerprintInput) {
  const normalized = {
    url: normalizeWhitespace(input.url || ""),
    title: normalizeWhitespace(input.title || ""),
    metaDescription: normalizeWhitespace(input.metaDescription || ""),
    h1Texts: (input.h1Texts ?? []).map((h) => normalizeWhitespace(h)).filter(Boolean),
    text: normalizeWhitespace(input.text || ""),
  };

  const extractedTextHash = sha256(normalized.text);
  const seoFingerprintHash = sha256(
    JSON.stringify({
      url: normalized.url,
      title: normalized.title,
      metaDescription: normalized.metaDescription,
      h1Texts: normalized.h1Texts,
      text: normalized.text,
    })
  );

  return { normalized, extractedTextHash, seoFingerprintHash };
}

export function buildMachinePageDiff(
  prev: PageFingerprintInput,
  next: PageFingerprintInput
): MachinePageDiff {
  const changedFields: string[] = [];

  const prevN = buildPageFingerprints(prev).normalized;
  const nextN = buildPageFingerprints(next).normalized;

  if (prevN.title !== nextN.title) changedFields.push("title");
  if (prevN.metaDescription !== nextN.metaDescription) changedFields.push("metaDescription");
  if (JSON.stringify(prevN.h1Texts) !== JSON.stringify(nextN.h1Texts)) changedFields.push("h1Texts");
  if (prevN.text !== nextN.text) changedFields.push("content");

  const machineDiffSummary =
    changedFields.length === 0
      ? "No detectable SEO-relevant page changes."
      : `Changed fields: ${changedFields.join(", ")}.`;

  return { changedFields, machineDiffSummary };
}

type CrawlPageForTracking = {
  url: string;
  canonicalUrl?: string | null;
  title?: string | null;
  metaDescription?: string | null;
  h1Texts?: string[] | null;
  visibleTextExcerpt?: string | null;
};

export async function computeAndPersistSiteChanges(input: {
  reportId: string;
  teamId: string;
  propertyId: string;
  crawlId?: string | null;
  pages: CrawlPageForTracking[];
}): Promise<SiteChanges> {
  const registryRows = await db.query.propertyPageRegistry.findMany({
    where: (r, { and, eq }) =>
      and(eq(r.propertyId, input.propertyId), eq(r.teamId, input.teamId)),
  });

  const snapshotIds = registryRows
    .map((row) => row.currentSnapshotId)
    .filter((value): value is string => Boolean(value));
  const previousSnapshots = snapshotIds.length
    ? await db.query.crawlPageSnapshots.findMany({
        where: (s, { inArray }) => inArray(s.id, snapshotIds),
      })
    : [];

  const prevSnapshotById = new Map(previousSnapshots.map((row) => [row.id, row]));
  const registryByCanonical = new Map(registryRows.map((row) => [row.canonicalUrl, row]));
  const activeRegistryRows = registryRows.filter((row) => row.isActive);
  const seenCanonicalUrls = new Set<string>();

  const siteChanges: SiteChanges = {
    newPages: [],
    changedPages: [],
    removedPages: [],
  };

  for (const page of input.pages) {
    const canonicalUrl = (page.canonicalUrl || page.url || "").trim();
    if (!canonicalUrl) continue;
    if (seenCanonicalUrls.has(canonicalUrl)) continue;
    seenCanonicalUrls.add(canonicalUrl);

    const fingerprints = buildPageFingerprints({
      url: canonicalUrl,
      title: page.title,
      metaDescription: page.metaDescription,
      h1Texts: page.h1Texts,
      text: page.visibleTextExcerpt,
    });

    const [snapshot] = await db
      .insert(crawlPageSnapshots)
      .values({
        id: `cps_${nanoid(12)}`,
        reportId: input.reportId,
        crawlId: input.crawlId ?? null,
        propertyId: input.propertyId,
        teamId: input.teamId,
        url: page.url,
        canonicalUrl,
        title: page.title ?? null,
        metaDescription: page.metaDescription ?? null,
        h1Texts: page.h1Texts ?? [],
        extractedTextHash: fingerprints.extractedTextHash,
        seoFingerprintHash: fingerprints.seoFingerprintHash,
      })
      .returning();

    const registry = registryByCanonical.get(canonicalUrl);
    if (!registry) {
      siteChanges.newPages.push({ url: canonicalUrl });
      const [insertedRegistry] = await db.insert(propertyPageRegistry).values({
        id: `ppr_${nanoid(12)}`,
        propertyId: input.propertyId,
        teamId: input.teamId,
        canonicalUrl,
        currentFingerprintHash: fingerprints.seoFingerprintHash,
        currentSnapshotId: snapshot.id,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        lastChangedAt: new Date(),
        lastReportId: input.reportId,
        isActive: true,
        updatedAt: new Date(),
      }).returning();
      registryByCanonical.set(canonicalUrl, insertedRegistry);
      continue;
    }

    if (!registry.isActive) {
      siteChanges.newPages.push({ url: canonicalUrl });
    }

    const prevSnapshot = registry.currentSnapshotId
      ? prevSnapshotById.get(registry.currentSnapshotId)
      : null;

    if (registry.currentFingerprintHash !== fingerprints.seoFingerprintHash) {
      const diff = buildMachinePageDiff(
        {
          url: canonicalUrl,
          title: prevSnapshot?.title ?? "",
          metaDescription: prevSnapshot?.metaDescription ?? "",
          h1Texts: Array.isArray(prevSnapshot?.h1Texts) ? (prevSnapshot?.h1Texts as string[]) : [],
          text: "",
        },
        {
          url: canonicalUrl,
          title: page.title ?? "",
          metaDescription: page.metaDescription ?? "",
          h1Texts: page.h1Texts ?? [],
          text: page.visibleTextExcerpt ?? "",
        }
      );

      siteChanges.changedPages.push({
        url: canonicalUrl,
        changedFields: diff.changedFields,
        machineDiffSummary: diff.machineDiffSummary,
      });

      await db
        .update(crawlPageSnapshots)
        .set({ machineDiffSummary: diff.machineDiffSummary })
        .where(eq(crawlPageSnapshots.id, snapshot.id));
    }

    await db
      .update(propertyPageRegistry)
      .set({
        currentFingerprintHash: fingerprints.seoFingerprintHash,
        currentSnapshotId: snapshot.id,
        lastSeenAt: new Date(),
        lastChangedAt:
          registry.currentFingerprintHash !== fingerprints.seoFingerprintHash ? new Date() : registry.lastChangedAt,
        lastReportId: input.reportId,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(propertyPageRegistry.id, registry.id));
  }

  const removed = activeRegistryRows.filter((row) => !seenCanonicalUrls.has(row.canonicalUrl));
  if (removed.length > 0) {
    siteChanges.removedPages = removed.map((row) => ({ url: row.canonicalUrl }));
    await db
      .update(propertyPageRegistry)
      .set({ isActive: false, updatedAt: new Date(), lastReportId: input.reportId })
      .where(
        and(
          eq(propertyPageRegistry.propertyId, input.propertyId),
          inArray(
            propertyPageRegistry.canonicalUrl,
            removed.map((row) => row.canonicalUrl)
          )
        )
      );
  }

  return siteChanges;
}
