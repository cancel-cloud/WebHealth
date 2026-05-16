import { createRequire } from "node:module"; const require = createRequire(import.meta.url);
import {
  nanoid
} from "./chunk-3WHTUT5J.js";
import {
  buildPosthogCaptureEndpoint,
  buildPosthogCapturePayload,
  buildProductEventPayload,
  resolvePosthogProjectToken
} from "./chunk-YMKACVQK.js";
import {
  db
} from "./chunk-4PAZP4FF.js";
import {
  productEvents
} from "./chunk-BBVSZM4K.js";

// packages/shared/src/lib/product-event-store.ts
async function recordProductEvent(input) {
  const payload = buildProductEventPayload(input);
  await db.insert(productEvents).values({
    id: `pe_${nanoid(12)}`,
    teamId: payload.teamId,
    userId: payload.userId,
    name: payload.name,
    source: payload.source,
    entityType: payload.entityType,
    entityId: payload.entityId,
    properties: payload.properties
  });
  await sendPosthogCapture(payload);
}
async function sendPosthogCapture(payload) {
  const capturePayload = buildPosthogCapturePayload(
    {
      projectToken: resolvePosthogProjectToken(process.env),
      host: process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST
    },
    payload
  );
  if (!capturePayload) return;
  try {
    await fetch(buildPosthogCaptureEndpoint({
      host: process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST
    }), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(capturePayload)
    });
  } catch (error) {
    console.warn("[product-events] PostHog capture failed", error);
  }
}

export {
  recordProductEvent
};
