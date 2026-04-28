import assert from "node:assert/strict";
import test from "node:test";

import { mapAdminUsers } from "./route.logic";

test("mapAdminUsers enriches admin users with sign-in time and plan limits", () => {
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
    lastSignInByUserId: new Map([["user_1", new Date("2026-03-28T20:55:30.000Z")]]),
    planSettingsByTier: new Map([
      [
        "free",
        {
          id: "plan_free",
          tier: "free",
          displayName: "Free",
          maxProperties: null,
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
      lastSignedInAt: new Date("2026-03-28T20:55:30.000Z"),
      planLimits: {
        id: "plan_free",
        tier: "free",
        displayName: "Free",
        maxProperties: null,
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    },
  ]);
});
