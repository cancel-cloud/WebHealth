import assert from "node:assert/strict";
import test from "node:test";

import { mapAdminUsers } from "./route.logic";

test("mapAdminUsers enriches admin users with deep dives usage and plan limits", () => {
  const result = mapAdminUsers({
    users: [
      {
        id: "user_1",
        name: "Lewis Mhlanga",
        email: "mhlewisa@gmail.com",
        image: null,
        createdAt: new Date("2026-03-28T20:55:30.000Z"),
        isRestricted: false,
        restrictionMessage: null,
        teamId: "team_1",
        teamName: "Lewis Team",
        tier: "free",
        propertiesCount: 0,
        lastSyncedAt: null,
      },
    ],
    reportCountByTeamId: new Map([["team_1", 7]]),
    reportsLast30DaysByTeamId: new Map([["team_1", 3]]),
    deepDivesTotalByTeamId: new Map([["team_1", 11]]),
    deepDivesThisMonthByTeamId: new Map([["team_1", 2]]),
    lastSignInByUserId: new Map([["user_1", new Date("2026-03-28T20:55:30.000Z")]]),
    planSettingsByTier: new Map([
      [
        "free",
        {
          id: "plan_free",
          tier: "free",
          displayName: "Free",
          reportsPerMonth: 5,
          maxProperties: null,
          detailsPerMonth: 20,
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ],
    ]),
  });

  assert.deepEqual(result, [
    {
      id: "user_1",
      name: "Lewis Mhlanga",
      email: "mhlewisa@gmail.com",
      image: null,
      createdAt: new Date("2026-03-28T20:55:30.000Z"),
      isRestricted: false,
      restrictionMessage: null,
      teamId: "team_1",
      teamName: "Lewis Team",
      tier: "free",
      propertiesCount: 0,
      lastSyncedAt: null,
      reportsCount: 7,
      reportsLast30Days: 3,
      deepDivesTotal: 11,
      deepDivesThisMonth: 2,
      lastSignedInAt: new Date("2026-03-28T20:55:30.000Z"),
      planLimits: {
        id: "plan_free",
        tier: "free",
        displayName: "Free",
        reportsPerMonth: 5,
        maxProperties: null,
        detailsPerMonth: 20,
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    },
  ]);
});
