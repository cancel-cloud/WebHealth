import assert from "node:assert/strict";
import test from "node:test";
import {
  clampAgencySites,
  DEFAULT_AGENCY_DENSITY,
  DEFAULT_AGENCY_HEADLINE,
  DEFAULT_AGENCY_HERO_VISUAL,
  DEFAULT_AGENCY_LANGUAGE,
  DEFAULT_AGENCY_SITE_COUNT,
  getAgencyPrice,
  getDefaultWorkspaceSelection,
  getLocalizedValue,
  getNextWorkspaceSelection,
} from "./agency-homepage.logic";

test("language helper reads the requested localized value", () => {
  assert.equal(
    getLocalizedValue({ en: "Start free", de: "Kostenlos starten" }, "de"),
    "Kostenlos starten",
  );
});

test("workspace selection transitions from portfolio to client and back", () => {
  const initialState = getDefaultWorkspaceSelection();
  const clientState = getNextWorkspaceSelection(
    initialState,
    { type: "show_client", index: 2 },
    4,
  );
  const backToPortfolio = getNextWorkspaceSelection(
    clientState,
    { type: "show_portfolio" },
    4,
  );

  assert.deepEqual(initialState, { view: "portfolio" });
  assert.deepEqual(clientState, { view: "client", index: 2 });
  assert.deepEqual(backToPortfolio, { view: "portfolio" });
});

test("agency slider math uses the reference pricing model", () => {
  assert.equal(getAgencyPrice(25), 149);
  assert.equal(getAgencyPrice(26), 155);
  assert.equal(getAgencyPrice(DEFAULT_AGENCY_SITE_COUNT), 299);
});

test("agency slider bounds are clamped to the allowed range", () => {
  assert.equal(clampAgencySites(1), 26);
  assert.equal(clampAgencySites(205), 200);
});

test("agency landing defaults stay locked to the chosen reference options", () => {
  assert.equal(DEFAULT_AGENCY_LANGUAGE, "en");
  assert.equal(DEFAULT_AGENCY_HEADLINE, "time");
  assert.equal(DEFAULT_AGENCY_HERO_VISUAL, "grid");
  assert.equal(DEFAULT_AGENCY_DENSITY, "spacious");
});
