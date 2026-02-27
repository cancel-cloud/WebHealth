import { db } from "@webhealth/shared/db";
import { properties, teams } from "@webhealth/shared/db/schema";
import { DebugConsole } from "./debug-console";
import { buildCombinedReportableProperties } from "@webhealth/shared/lib/properties/reportable-properties";

export default async function AiReportDebugPage() {
  const [teamRows, propertyRows] = await Promise.all([
    db.select({ id: teams.id, name: teams.name }).from(teams),
    db
      .select({
        id: properties.id,
        teamId: properties.teamId,
        type: properties.type,
        name: properties.name,
        url: properties.url,
        ga4PropertyId: properties.ga4PropertyId,
      })
      .from(properties),
  ]);
  const reportableProperties = buildCombinedReportableProperties(propertyRows).map((p) => ({
    id: p.id,
    teamId: p.teamId,
    label: p.label,
    gscPropertyId: p.gscPropertyId,
    ga4DbId: p.ga4DbId,
    ga4PropertyId: p.ga4PropertyId,
    isLinked: p.isLinked,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Report Debug Console</h1>
        <p className="text-muted-foreground text-sm">
          Test report generation, inspect queue leases/heartbeats, and review job events plus estimated AI costs.
        </p>
      </div>
      <DebugConsole teams={teamRows} properties={reportableProperties} />
    </div>
  );
}
