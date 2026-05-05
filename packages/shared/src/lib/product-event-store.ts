import { nanoid } from "nanoid";
import { db } from "../db";
import { productEvents } from "../db/schema";
import {
  type BuildProductEventPayloadInput,
  buildPosthogCaptureEndpoint,
  buildPosthogCapturePayload,
  buildProductEventPayload,
  resolvePosthogProjectToken,
} from "./product-events";

export async function recordProductEvent(input: BuildProductEventPayloadInput) {
  const payload = buildProductEventPayload(input);

  await db.insert(productEvents).values({
    id: `pe_${nanoid(12)}`,
    teamId: payload.teamId,
    userId: payload.userId,
    name: payload.name,
    source: payload.source,
    entityType: payload.entityType,
    entityId: payload.entityId,
    properties: payload.properties,
  });

  await sendPosthogCapture(payload);
}

async function sendPosthogCapture(payload: ReturnType<typeof buildProductEventPayload>) {
  const capturePayload = buildPosthogCapturePayload(
    {
      projectToken: resolvePosthogProjectToken(process.env),
      host: process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST,
    },
    payload,
  );
  if (!capturePayload) return;

  try {
    await fetch(buildPosthogCaptureEndpoint({
      host: process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST,
    }), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(capturePayload),
    });
  } catch (error) {
    console.warn("[product-events] PostHog capture failed", error);
  }
}
