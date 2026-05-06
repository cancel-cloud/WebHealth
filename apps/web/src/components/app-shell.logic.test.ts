import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_SIDEBAR_PROPERTIES_REFRESH_EVENT,
  dispatchAppSidebarPropertiesRefresh,
  getAppSidebarFooterThemeOptions,
  getAppSidebarThemeChoiceClasses,
  getAppSidebarItemClasses,
  getAppSidebarModel,
  shouldApplyAppSidebarMetaLoad,
} from "./app-shell.logic";

test("settings route marks settings current and keeps support links grouped", () => {
  const model = getAppSidebarModel({ pathname: "/settings", isAdmin: false });

  assert.deepEqual(model.primaryItems.map((item) => item.label), [
    "Overview",
    "Properties",
    "AI Insights",
    "Settings",
  ]);
  assert.equal(model.primaryItems.find((item) => item.href === "/settings")?.current, true);
  assert.equal(model.supportGroup.label, "Support");
  assert.deepEqual(model.supportGroup.items.map((item) => item.label), ["Contact Support", "Feature Requests"]);
  assert.equal(model.supportGroup.items.find((item) => item.label === "Contact Support")?.href, "/settings?tab=contact");
  assert.equal(model.supportGroup.items.find((item) => item.label === "Feature Requests")?.action, "feature-request");
  assert.equal(model.adminItems.length, 0);
});

test("contact settings route marks the support group current", () => {
  const model = getAppSidebarModel({ pathname: "/settings", isAdmin: false, tab: "contact" });

  assert.equal(model.primaryItems.find((item) => item.href === "/settings")?.current, false);
  assert.equal(model.supportGroup.current, true);
  assert.equal(model.supportGroup.items.find((item) => item.href === "/settings?tab=contact")?.current, true);
});

test("nested settings routes keep settings current", () => {
  const model = getAppSidebarModel({ pathname: "/settings/branding", isAdmin: false });

  assert.equal(model.primaryItems.find((item) => item.href === "/settings")?.current, true);
  assert.equal(model.supportGroup.current, false);
});

test("ai insights view gets a dedicated public sidebar item", () => {
  const model = getAppSidebarModel({
    pathname: "/dashboard",
    isAdmin: false,
    view: "ai-insights",
  });

  assert.equal(model.primaryItems.find((item) => item.id === "dashboard")?.current, false);
  assert.equal(model.primaryItems.find((item) => item.id === "ai-insights")?.current, true);
  assert.equal(model.primaryItems.find((item) => item.id === "ai-insights")?.href, "/dashboard?view=ai-insights");
});

test("admin routes expose admin items and mark the matching entry current", () => {
  const model = getAppSidebarModel({ pathname: "/admin/feedback", isAdmin: true });

  assert.equal(model.primaryItems.find((item) => item.href === "/dashboard")?.current, false);
  assert.equal(model.adminItems.find((item) => item.href === "/admin/feedback")?.current, true);
  assert.equal(model.adminItems.find((item) => item.href === "/admin/feedback")?.icon, "mail");
});

test("glitchtip admin route exposes the test page and marks it current", () => {
  const model = getAppSidebarModel({ pathname: "/admin/glitchtip-test", isAdmin: true });

  assert.equal(model.adminItems.find((item) => item.href === "/admin/glitchtip-test")?.current, true);
  assert.equal(model.adminItems.find((item) => item.href === "/admin/glitchtip-test")?.label, "GlitchTip Test");
  assert.equal(model.adminItems.find((item) => item.href === "/admin/glitchtip-test")?.icon, "bug");
});

test("inactive sidebar items use a stronger hover treatment than the resting state", () => {
  const classes = getAppSidebarItemClasses({ current: false, nested: false });

  assert.match(classes.link, /hover:bg-sidebar-accent\b/);
  assert.ok(!classes.link.includes("hover:bg-sidebar-accent/"));
  assert.match(classes.link, /hover:text-sidebar-accent-foreground\b/);
  assert.match(classes.icon, /group-hover:text-sidebar-accent-foreground\b/);
});

test("active sidebar items keep one strong selected surface without stacking a hover darken", () => {
  const classes = getAppSidebarItemClasses({ current: true, nested: false });

  assert.match(classes.link, /\bbg-sidebar-accent\b/);
  assert.ok(!classes.link.includes("bg-sidebar-accent/"));
  assert.ok(!classes.link.includes("hover:bg-sidebar-accent"));
  assert.match(classes.link, /text-sidebar-accent-foreground\b/);
});

test("sidebar footer theme options use the approved labels and order", () => {
  assert.deepEqual(getAppSidebarFooterThemeOptions(), [
    { value: "system", label: "System" },
    { value: "light", label: "Lightmode" },
    { value: "dark", label: "Darkmode" },
  ]);
});

test("sidebar theme choices use stacked full-width segments with one active surface", () => {
  const activeClasses = getAppSidebarThemeChoiceClasses({ active: true, first: false, last: false });
  const inactiveClasses = getAppSidebarThemeChoiceClasses({ active: false, first: false, last: false });

  assert.match(activeClasses, /\bw-full\b/);
  assert.match(activeClasses, /\bjustify-start\b/);
  assert.match(activeClasses, /\bbg-sidebar-accent\b/);
  assert.ok(!activeClasses.includes("bg-sidebar-accent/"));
  assert.ok(!activeClasses.includes("hover:bg-sidebar-accent"));
  assert.match(inactiveClasses, /\bhover:bg-sidebar-accent\b/);
  assert.ok(!inactiveClasses.includes("hover:bg-sidebar-accent/"));
  assert.match(inactiveClasses, /\bborder-t\b/);
  assert.match(inactiveClasses, /\bpy-2\b/);
  assert.ok(!inactiveClasses.includes("py-3"));
});

test("sidebar property refresh dispatches the shared refresh event", () => {
  const dispatchedTypes: string[] = [];

  dispatchAppSidebarPropertiesRefresh({
    dispatchEvent(event) {
      dispatchedTypes.push(event.type);
      return true;
    },
  });

  assert.deepEqual(dispatchedTypes, [APP_SIDEBAR_PROPERTIES_REFRESH_EVENT]);
});

test("sidebar meta loader ignores stale responses from earlier requests", () => {
  assert.equal(shouldApplyAppSidebarMetaLoad(1, 2), false);
  assert.equal(shouldApplyAppSidebarMetaLoad(2, 2), true);
});
