import { createHmac, timingSafeEqual } from "node:crypto";

type ArtifactTokenPayload = {
  artifactKey: string;
  reportId: string;
  exp: number;
};

function getArtifactTokenSecret() {
  const secret = process.env.ARTIFACT_TOKEN_SECRET?.trim();
  if (!secret) {
    throw new Error("ARTIFACT_TOKEN_SECRET is required");
  }
  return secret;
}

function encodeSegment(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signSegment(encodedPayload: string) {
  return createHmac("sha256", getArtifactTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function mintArtifactDownloadToken(input: {
  artifactKey: string;
  reportId: string;
  ttlSeconds?: number;
}) {
  const payload: ArtifactTokenPayload = {
    artifactKey: input.artifactKey,
    reportId: input.reportId,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 60),
  };
  const encodedPayload = encodeSegment(JSON.stringify(payload));
  const signature = signSegment(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyArtifactDownloadToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = signSegment(encodedPayload);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(provided, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ArtifactTokenPayload;
    if (!parsed?.artifactKey || !parsed?.reportId || typeof parsed?.exp !== "number") {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
