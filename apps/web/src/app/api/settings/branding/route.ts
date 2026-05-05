import { NextResponse } from "next/server";
import {
  getEmptyTeamBrandingProfile,
  getTeamBrandingProfile,
  upsertTeamBrandingProfile,
} from "@webhealth/shared/lib/team-branding";
import { requirePrimaryTeamMembership, requireSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    const session = await requireSession();
    const membership = await requirePrimaryTeamMembership(session);
    const branding = membership.teamId
      ? await getTeamBrandingProfile(membership.teamId)
      : getEmptyTeamBrandingProfile();

    return NextResponse.json({ branding });
  } catch (error) {
    return handleRouteError("GET /api/settings/branding error", error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const membership = await requirePrimaryTeamMembership(session);
    const body = (await req.json()) as Record<string, unknown>;

    const branding = await upsertTeamBrandingProfile(membership.teamId, {
      agencyName: typeof body.agencyName === "string" ? body.agencyName : undefined,
      contactName: typeof body.contactName === "string" ? body.contactName : undefined,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : undefined,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : undefined,
      websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : undefined,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : undefined,
      iconUrl: typeof body.iconUrl === "string" ? body.iconUrl : undefined,
      primaryColor: typeof body.primaryColor === "string" ? body.primaryColor : undefined,
      accentColor: typeof body.accentColor === "string" ? body.accentColor : undefined,
      footerNote: typeof body.footerNote === "string" ? body.footerNote : undefined,
    });

    return NextResponse.json({ branding });
  } catch (error) {
    return handleRouteError("PATCH /api/settings/branding error", error);
  }
}
