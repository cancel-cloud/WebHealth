import { NextResponse } from "next/server";
import {
  buildPosthogCaptureEndpoint,
  buildPosthogCapturePayload,
  buildProductEventPayload,
  resolvePosthogProjectToken,
} from "@webhealth/shared/lib/product-events";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import {
  buildPosthogInstallCheckConfigStatus,
  shapePosthogInstallCheckResult,
} from "./route.logic";

function getPosthogEnvConfig() {
  return {
    projectToken: resolvePosthogProjectToken(process.env),
    browserKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    captureHost: process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST,
    projectId: process.env.POSTHOG_PROJECT_ID,
    uiHost: process.env.POSTHOG_UI_HOST,
  };
}

export async function GET() {
  try {
    await requireAdminSession();

    return NextResponse.json({
      config: buildPosthogInstallCheckConfigStatus(getPosthogEnvConfig()),
    });
  } catch (error: unknown) {
    return handleRouteError("GET /api/admin/posthog/install-check error", error);
  }
}

export async function POST() {
  try {
    const session = await requireAdminSession();
    const config = getPosthogEnvConfig();
    const endpoint = buildPosthogCaptureEndpoint({ host: config.captureHost });
    const eventName = "posthog_install_check_ran";
    const payload = buildProductEventPayload({
      teamId: "internal_admin",
      userId: session.user.id,
      name: eventName,
      source: "admin",
      entityType: "posthog",
      entityId: config.projectId ?? null,
      properties: {
        captureHost: buildPosthogInstallCheckConfigStatus(config).captureHost,
        uiHost: buildPosthogInstallCheckConfigStatus(config).uiHost,
        projectId: config.projectId ?? null,
      },
    });
    const capturePayload = buildPosthogCapturePayload(
      { projectToken: config.projectToken, host: config.captureHost },
      payload,
    );

    if (!capturePayload) {
      return NextResponse.json({
        config: buildPosthogInstallCheckConfigStatus(config),
        result: shapePosthogInstallCheckResult({
          ok: false,
          status: null,
          endpoint,
          eventName,
        }),
      }, { status: 400 });
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(capturePayload),
    });

    return NextResponse.json({
      config: buildPosthogInstallCheckConfigStatus(config),
      result: shapePosthogInstallCheckResult({
        ok: response.ok,
        status: response.status,
        endpoint,
        eventName,
      }),
    }, { status: response.ok ? 200 : 502 });
  } catch (error: unknown) {
    return handleRouteError("POST /api/admin/posthog/install-check error", error);
  }
}
