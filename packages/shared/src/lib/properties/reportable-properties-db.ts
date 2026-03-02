import { db } from "@webhealth/shared/db";
import { properties } from "@webhealth/shared/db/schema";
import {
  buildCombinedReportableProperties,
  resolveReportSourcesFromProperties,
} from "@webhealth/shared/lib/properties/reportable-properties";

type DbProperty = typeof properties.$inferSelect;

async function listTeamProperties(teamId: string): Promise<DbProperty[]> {
  return db.query.properties.findMany({
    where: (p, { eq }) => eq(p.teamId, teamId),
  });
}

export async function listTeamCombinedReportableProperties(teamId: string) {
  const teamProperties = await listTeamProperties(teamId);
  return buildCombinedReportableProperties(teamProperties);
}

export async function resolveTeamReportSources(teamId: string, selectedPropertyId: string) {
  const teamProperties = await listTeamProperties(teamId);

  if (!teamProperties.some((p) => p.id === selectedPropertyId)) {
    throw new Error("Property not found or unauthorized");
  }

  return resolveReportSourcesFromProperties(teamProperties, selectedPropertyId);
}

export async function resolveReportSourcesForExistingReport(report: {
  teamId: string;
  propertyId: string;
}) {
  return resolveTeamReportSources(report.teamId, report.propertyId);
}
