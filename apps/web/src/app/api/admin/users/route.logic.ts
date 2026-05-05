export interface AdminUserRouteRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  isRestricted: boolean;
  restrictionMessage: string | null;
  teamId: string | null;
  teamName: string | null;
  tier: string | null;
  propertiesCount: number;
  lastSyncedAt: Date | null;
}

export interface AdminUserPlanSettings {
  id: string;
  tier: string;
  displayName: string;
  maxProperties: number | null;
  updatedAt: Date;
}

interface MapAdminUsersInput {
  users: AdminUserRouteRow[];
  lastSignInByUserId: Map<string, Date | null>;
  planSettingsByTier: Map<string, AdminUserPlanSettings>;
}

export function mapAdminUsers({
  users,
  lastSignInByUserId,
  planSettingsByTier,
}: MapAdminUsersInput) {
  return users.map((user) => ({
    ...user,
    lastSignedInAt: lastSignInByUserId.get(user.id) ?? null,
    planLimits: user.tier ? (planSettingsByTier.get(user.tier) ?? null) : null,
  }));
}
