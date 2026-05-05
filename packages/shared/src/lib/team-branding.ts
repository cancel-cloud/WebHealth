import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { teamBrandingProfiles } from "@webhealth/shared/db/schema";

export type TeamBrandingProfile = {
  agencyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  logoUrl: string;
  iconUrl: string;
  primaryColor: string;
  accentColor: string;
  footerNote: string;
};

type TeamBrandingProfileRecord = {
  agencyName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  footerNote: string | null;
};

const EMPTY_TEAM_BRANDING_PROFILE: TeamBrandingProfile = {
  agencyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  websiteUrl: "",
  logoUrl: "",
  iconUrl: "",
  primaryColor: "#6366f1",
  accentColor: "#0ea5e9",
  footerNote: "",
};

function normalizeOptionalString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeColor(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim() ?? "";
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

export function normalizeTeamBrandingProfile(
  value: Partial<TeamBrandingProfile> | null | undefined,
): TeamBrandingProfile {
  return {
    agencyName: normalizeOptionalString(value?.agencyName),
    contactName: normalizeOptionalString(value?.contactName),
    contactEmail: normalizeOptionalString(value?.contactEmail),
    contactPhone: normalizeOptionalString(value?.contactPhone),
    websiteUrl: normalizeOptionalString(value?.websiteUrl),
    logoUrl: normalizeOptionalString(value?.logoUrl),
    iconUrl: normalizeOptionalString(value?.iconUrl),
    primaryColor: normalizeColor(value?.primaryColor, EMPTY_TEAM_BRANDING_PROFILE.primaryColor),
    accentColor: normalizeColor(value?.accentColor, EMPTY_TEAM_BRANDING_PROFILE.accentColor),
    footerNote: normalizeOptionalString(value?.footerNote),
  };
}

function toPartialBrandingProfile(
  value:
    | TeamBrandingProfileRecord
    | Partial<TeamBrandingProfile>
    | null
    | undefined,
): Partial<TeamBrandingProfile> | null | undefined {
  if (!value) return value;

  return {
    agencyName: value.agencyName ?? undefined,
    contactName: value.contactName ?? undefined,
    contactEmail: value.contactEmail ?? undefined,
    contactPhone: value.contactPhone ?? undefined,
    websiteUrl: value.websiteUrl ?? undefined,
    logoUrl: value.logoUrl ?? undefined,
    iconUrl: value.iconUrl ?? undefined,
    primaryColor: value.primaryColor ?? undefined,
    accentColor: value.accentColor ?? undefined,
    footerNote: value.footerNote ?? undefined,
  };
}

export async function getTeamBrandingProfile(teamId: string) {
  const row = await db.query.teamBrandingProfiles.findFirst({
    where: (table, { eq }) => eq(table.teamId, teamId),
  });

  return normalizeTeamBrandingProfile(toPartialBrandingProfile(row));
}

export async function upsertTeamBrandingProfile(
  teamId: string,
  value: Partial<TeamBrandingProfile>,
) {
  const profile = normalizeTeamBrandingProfile(value);

  const [row] = await db
    .insert(teamBrandingProfiles)
    .values({
      id: `tbp_${nanoid(12)}`,
      teamId,
      ...profile,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: teamBrandingProfiles.teamId,
      set: {
        ...profile,
        updatedAt: new Date(),
      },
    })
    .returning();

  return normalizeTeamBrandingProfile(toPartialBrandingProfile(row));
}

export function getEmptyTeamBrandingProfile() {
  return { ...EMPTY_TEAM_BRANDING_PROFILE };
}
