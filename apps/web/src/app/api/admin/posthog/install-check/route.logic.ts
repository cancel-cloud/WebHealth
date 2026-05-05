import {
  DEFAULT_POSTHOG_CAPTURE_HOST,
  DEFAULT_POSTHOG_UI_HOST,
} from "@webhealth/shared/lib/product-events";

type PosthogInstallCheckConfig = {
  projectToken?: string | null;
  browserKey?: string | null;
  captureHost?: string | null;
  projectId?: string | null;
  uiHost?: string | null;
};

export type PosthogInstallCheckResult = {
  ok: boolean;
  status: number | null;
  endpoint: string;
  eventName: "posthog_install_check_ran";
};

function normalizeHost(value: string | null | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

export function buildPosthogInstallCheckConfigStatus(config: PosthogInstallCheckConfig) {
  return {
    hasServerProjectToken: Boolean(config.projectToken?.trim()),
    hasBrowserKey: Boolean(config.browserKey?.trim()),
    hasProjectId: Boolean(config.projectId?.trim()),
    captureHost: normalizeHost(config.captureHost, DEFAULT_POSTHOG_CAPTURE_HOST),
    uiHost: normalizeHost(config.uiHost, DEFAULT_POSTHOG_UI_HOST),
    projectId: config.projectId?.trim() || null,
  };
}

export function shapePosthogInstallCheckResult(
  result: PosthogInstallCheckResult,
): PosthogInstallCheckResult {
  return {
    ok: result.ok,
    status: result.status,
    endpoint: result.endpoint,
    eventName: result.eventName,
  };
}
