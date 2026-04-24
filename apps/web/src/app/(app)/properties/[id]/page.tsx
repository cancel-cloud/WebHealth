import { notFound, redirect } from "next/navigation";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { getLiveDashboardData } from "@webhealth/shared/lib/live-dashboard";
import { getTeamBrandingProfile } from "@webhealth/shared/lib/team-branding";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { PropertyDashboardClient } from "./property-dashboard-client";

export default async function PropertyDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireUnrestrictedSession();
  const membership = await requirePrimaryTeamMembership(session);
  const { id } = await params;
  const propertyId = decodeRouteParam(id);
  const query = await searchParams;

  let resolved;
  try {
    resolved = await resolveTeamReportSources(membership.teamId, propertyId);
  } catch {
    notFound();
  }

  if (resolved.selectedProperty.id !== resolved.canonicalGscProperty.id) {
    redirect(`/properties/${encodeURIComponent(resolved.canonicalGscProperty.id)}`);
  }

  const [dashboard, branding] = await Promise.all([
    getLiveDashboardData({
      teamId: membership.teamId,
      propertyId: resolved.canonicalGscProperty.id,
      preset: typeof query.preset === "string" ? query.preset : null,
      compareMode: typeof query.compare === "string" ? query.compare : null,
      startDate: typeof query.start === "string" ? query.start : null,
      endDate: typeof query.end === "string" ? query.end : null,
    }),
    getTeamBrandingProfile(membership.teamId),
  ]);

  return (
    <PropertyDashboardClient
      dashboard={dashboard}
      currentUser={{
        id: session.user.id,
        email: session.user.email,
      }}
      brandColors={{
        primary: branding.primaryColor,
        accent: branding.accentColor,
      }}
    />
  );
}
