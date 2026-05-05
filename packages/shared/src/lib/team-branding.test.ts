import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTeamBrandingProfile } from "./team-branding";

test("normalizeTeamBrandingProfile trims strings and falls back to default colors", () => {
  assert.deepEqual(
    normalizeTeamBrandingProfile({
      agencyName: "  DevBrew  ",
      contactEmail: "  hello@devbrew.dev ",
      primaryColor: "invalid",
      accentColor: "#123456",
    }),
    {
      agencyName: "DevBrew",
      contactName: "",
      contactEmail: "hello@devbrew.dev",
      contactPhone: "",
      websiteUrl: "",
      logoUrl: "",
      iconUrl: "",
      primaryColor: "#6366f1",
      accentColor: "#123456",
      footerNote: "",
    },
  );
});
