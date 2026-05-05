import { and, eq, inArray } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { planSettings, properties } from "@webhealth/shared/db/schema";
import {
  buildDeactivationPlan,
  isDowngrade,
  type CullingPropertyRow,
} from "@webhealth/shared/lib/tier-change-cleanup-policy";

export type { CullingPropertyRow } from "@webhealth/shared/lib/tier-change-cleanup-policy";

export async function cleanupAfterTierChange(input: {
  teamId: string;
  oldTier: string;
  newTier: string;
}): Promise<{ deactivatedPropertyGroups: number }> {
  const [oldPlan, newPlan] = await Promise.all([
    db.query.planSettings.findFirst({
      where: eq(planSettings.tier, input.oldTier),
      columns: { maxProperties: true },
    }),
    db.query.planSettings.findFirst({
      where: eq(planSettings.tier, input.newTier),
      columns: { maxProperties: true },
    }),
  ]);

  const oldMax = oldPlan?.maxProperties ?? null;
  const newMax = newPlan?.maxProperties ?? null;

  if (!isDowngrade(oldMax, newMax)) {
    return { deactivatedPropertyGroups: 0 };
  }

  const teamProperties = await db.query.properties.findMany({
    where: eq(properties.teamId, input.teamId),
    columns: { id: true, type: true, ga4PropertyId: true, active: true, createdAt: true },
  });

  const plan = buildDeactivationPlan({
    properties: teamProperties as CullingPropertyRow[],
    maxAllowed: newMax!,
  });

  if (plan.deactivatedPropertyIds.length > 0) {
    await db
      .update(properties)
      .set({ active: false })
      .where(
        and(
          eq(properties.teamId, input.teamId),
          inArray(properties.id, plan.deactivatedPropertyIds),
        ),
      );
  }

  return { deactivatedPropertyGroups: plan.deactivatedGroupCount };
}