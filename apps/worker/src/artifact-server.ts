import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { getArtifactStore } from "@webhealth/shared/lib/reports/artifacts/store";

const EXPECTED_SECRET = process.env.WORKER_API_SECRET ?? "";
const PORT = parseInt(process.env.WORKER_HTTP_PORT ?? "9100", 10);

function isAuthorized(authHeader: string | undefined): boolean {
  if (!EXPECTED_SECRET || !authHeader) return false;
  const provided = authHeader.replace(/^Bearer\s+/, "");
  if (provided.length !== EXPECTED_SECRET.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(EXPECTED_SECRET));
}

function isValidArtifactKey(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return false;
  }
  return /^reports\/[a-zA-Z0-9_-]+\/\d+-[a-zA-Z0-9._-]+$/.test(key);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "GET" || url.pathname !== "/artifacts") {
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  if (!isAuthorized(req.headers.authorization)) {
    res.writeHead(401);
    res.end("Unauthorized");
    return;
  }

  const key = url.searchParams.get("key");
  if (!key || !isValidArtifactKey(key)) {
    res.writeHead(400);
    res.end("Invalid artifact key");
    return;
  }

  try {
    const ref = await getArtifactStore().getDownloadRef(key);
    if (!ref.path) {
      res.writeHead(404);
      res.end("Artifact not found");
      return;
    }

    const fileStat = await stat(ref.path);
    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Length": fileStat.size,
    });
    createReadStream(ref.path).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Artifact not found");
  }
});

export function startArtifactServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`[artifact-server] listening on port ${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });
}
