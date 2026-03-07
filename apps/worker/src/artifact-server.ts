import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { getArtifactStore } from "@webhealth/shared/lib/reports/artifacts/store";
import { verifyArtifactDownloadToken } from "@webhealth/shared/lib/artifact-token";

const PORT = parseInt(process.env.WORKER_HTTP_PORT ?? "9100", 10);

function isValidArtifactKey(key: string): boolean {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return false;
  }
  return /^reports\/[a-zA-Z0-9_-]+\/\d+-[a-zA-Z0-9._-]+$/.test(key);
}

export function extractReportIdFromArtifactKey(key: string): string | null {
  const match = key.match(/^reports\/([a-zA-Z0-9_-]+)\//);
  return match?.[1] ?? null;
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

  const token = url.searchParams.get("token");
  const verified = token ? verifyArtifactDownloadToken(token) : null;
  if (!verified) {
    console.warn("[artifact-server][WARN][AUTH] unauthorized artifact request");
    res.writeHead(401);
    res.end("Unauthorized");
    return;
  }

  const key = verified.artifactKey;
  if (!key || !isValidArtifactKey(key)) {
    console.warn(`[artifact-server][WARN][REQUEST] invalid artifact key key=${key ?? "missing"}`);
    res.writeHead(400);
    res.end("Invalid artifact key");
    return;
  }

  const reportId = extractReportIdFromArtifactKey(key) ?? "unknown";
  if (reportId !== verified.reportId) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  console.log(`[artifact-server][INFO][REQUEST] download requested reportId=${reportId} key=${key}`);

  try {
    const ref = await getArtifactStore().getDownloadRef(key);
    if (!ref.path) {
      console.warn(`[artifact-server][WARN][NOT_FOUND] reportId=${reportId} key=${key}`);
      res.writeHead(404);
      res.end("Artifact not found");
      return;
    }

    const fileStat = await stat(ref.path);
    console.log(
      `[artifact-server][INFO][STREAM] reportId=${reportId} key=${key} bytes=${fileStat.size}`
    );
    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Length": fileStat.size,
    });
    createReadStream(ref.path).pipe(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    console.warn(
      `[artifact-server][WARN][ERROR] reportId=${reportId} key=${key} error=${message}`
    );
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
