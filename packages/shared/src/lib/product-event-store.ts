import { nanoid } from "nanoid";
import { db } from "../db";
import { productEvents } from "../db/schema";
import {
  type BuildProductEventPayloadInput,
  buildPosthogCapturePayload,
  buildProductEventPayload,
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
      apiKey: process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY,
      host: process.env.POSTHOG_HOST,
    },
    payload,
  );
  if (!capturePayload) return;

  const host = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(capturePayload),
    });
  } catch (error) {
    console.warn("[product-events] PostHog capture failed", error);
  }
}
