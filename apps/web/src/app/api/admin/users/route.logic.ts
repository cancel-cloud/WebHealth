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
  reportsPerMonth: number | null;
  maxProperties: number | null;
  detailsPerMonth: number | null;
  updatedAt: Date;
}

interface MapAdminUsersInput {
  users: AdminUserRouteRow[];
  reportCountByTeamId: Map<string, number>;
  reportsLast30DaysByTeamId: Map<string, number>;
  deepDivesTotalByTeamId: Map<string, number>;
  deepDivesThisMonthByTeamId: Map<string, number>;
  lastSignInByUserId: Map<string, Date | null>;
  planSettingsByTier: Map<string, AdminUserPlanSettings>;
}

export function mapAdminUsers({
  users,
  reportCountByTeamId,
  reportsLast30DaysByTeamId,
  deepDivesTotalByTeamId,
  deepDivesThisMonthByTeamId,
  lastSignInByUserId,
  planSettingsByTier,
}: MapAdminUsersInput) {
  return users.map((user) => ({
    ...user,
    reportsCount: user.teamId ? (reportCountByTeamId.get(user.teamId) ?? 0) : 0,
    reportsLast30Days: user.teamId ? (reportsLast30DaysByTeamId.get(user.teamId) ?? 0) : 0,
    deepDivesTotal: user.teamId ? (deepDivesTotalByTeamId.get(user.teamId) ?? 0) : 0,
    deepDivesThisMonth: user.teamId ? (deepDivesThisMonthByTeamId.get(user.teamId) ?? 0) : 0,
    lastSignedInAt: lastSignInByUserId.get(user.id) ?? null,
    planLimits: user.tier ? (planSettingsByTier.get(user.tier) ?? null) : null,
  }));
}
