import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@webhealth/shared/db";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { getLiveDashboardData } from "@webhealth/shared/lib/live-dashboard";
import { getTeamBrandingProfile } from "@webhealth/shared/lib/team-branding";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { getUserPreferredLanguage } from "@/lib/server/language";
import { PropertyDashboardClient } from "./property-dashboard-client";
import { SetupDismissButton } from "../../dashboard/setup-dismiss-button";

const PROPERTY_DETAIL_COPY = {
  en: {
    analyticsNotLinked: "This Analytics property is active, but it is not linked to Search Console yet.",
    limitedDashboard: "Limited dashboard",
    ga4Limited: "Prioritized actions need both GA4 and Search Console. Link this GA4 source to a matching Search Console property on the Properties page to unlock the live decision surface.",
    openProperties: "Open Properties",
    incompleteTitle: "Analytics setup is incomplete",
    incompleteDescription: "Prioritized actions are limited without a linked GA4 property. Open Properties to connect the matching Analytics source.",
  },
  de: {
    analyticsNotLinked: "Diese Analytics-Property ist aktiv, aber noch nicht mit Search Console verknüpft.",
    limitedDashboard: "Eingeschränktes Dashboard",
    ga4Limited: "Priorisierte Maßnahmen benötigen GA4 und Search Console. Verknüpfe diese GA4-Quelle auf der Properties-Seite mit einer passenden Search-Console-Property, um die Live-Entscheidungsfläche freizuschalten.",
    openProperties: "Properties öffnen",
    incompleteTitle: "Analytics-Setup ist unvollständig",
    incompleteDescription: "Priorisierte Maßnahmen sind ohne verknüpfte GA4-Property eingeschränkt. Öffne Properties, um die passende Analytics-Quelle zu verbinden.",
  },
} as const;

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
  const language = await getUserPreferredLanguage(session.user.id);
  const copy = PROPERTY_DETAIL_COPY[language];

  let resolved;
  try {
    resolved = await resolveTeamReportSources(membership.teamId, propertyId);
  } catch {
    const property = await db.query.properties.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, propertyId), eq(table.teamId, membership.teamId), eq(table.active, true)),
    });
    if (property?.type === "ga4") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{property.name}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {copy.analyticsNotLinked}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200/70 bg-amber-50/70 p-5 text-amber-950">
            <h2 className="text-lg font-semibold">{copy.limitedDashboard}</h2>
            <p className="mt-2 text-sm">
              {copy.ga4Limited}
            </p>
            <Link className="mt-4 inline-flex text-sm font-semibold text-primary" href="/properties">
              {copy.openProperties}
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  if (resolved.selectedProperty.id !== resolved.canonicalGscProperty.id) {
    redirect(`/properties/${encodeURIComponent(resolved.canonicalGscProperty.id)}`);
  }

  const [dashboard, branding, setupDismissal] = await Promise.all([
    getLiveDashboardData({
      teamId: membership.teamId,
      propertyId: resolved.canonicalGscProperty.id,
      language,
      preset: typeof query.preset === "string" ? query.preset : null,
      compareMode: typeof query.compare === "string" ? query.compare : null,
      startDate: typeof query.start === "string" ? query.start : null,
      endDate: typeof query.end === "string" ? query.end : null,
    }),
    getTeamBrandingProfile(membership.teamId),
    db.query.propertySetupDismissals.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.teamId, membership.teamId), eq(table.userId, session.user.id), eq(table.propertyId, resolved.canonicalGscProperty.id)),
      columns: { id: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      {!resolved.linkedGa4Property && !setupDismissal ? (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-200/70 bg-amber-50/70 p-4 text-amber-950">
          <div>
            <h2 className="text-sm font-semibold">{copy.incompleteTitle}</h2>
            <p className="mt-1 text-sm">
              {copy.incompleteDescription}
            </p>
            <Link className="mt-2 inline-flex text-sm font-semibold text-primary" href="/properties">
              {copy.openProperties}
            </Link>
          </div>
          <SetupDismissButton propertyId={resolved.canonicalGscProperty.id} />
        </div>
      ) : null}
      <PropertyDashboardClient
        dashboard={dashboard}
        language={language}
        currentUser={{
          id: session.user.id,
          email: session.user.email,
        }}
        brandColors={{
          primary: branding.primaryColor,
          accent: branding.accentColor,
        }}
      />
    </div>
  );
}
