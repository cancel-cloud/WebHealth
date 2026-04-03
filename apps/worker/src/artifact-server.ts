import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { getArtifactStore } from "@webhealth/shared/lib/reports/artifacts/store";
import { verifyArtifactDownloadToken } from "@webhealth/shared/lib/artifact-token";
import {
  buildWorkerReadinessSnapshot,
  type WorkerRuntimeState,
} from "./runtime-state";

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

function buildWorkerHealthResponse(
  state: WorkerRuntimeState,
  input?: { nowMs?: number; staleAfterMs?: number },
) {
  const readiness = buildWorkerReadinessSnapshot(state, input);
  return {
    statusCode:
      readiness.reason === "fatal_error" || readiness.reason === "shutting_down"
        ? 503
        : 200,
    body: {
      ok:
        readiness.reason !== "fatal_error" &&
        readiness.reason !== "shutting_down",
      ready: readiness.ok,
      phase: readiness.phase,
      reason: readiness.reason,
      currentJobId: readiness.currentJobId,
    },
  };
}

export function buildWorkerReadyResponse(
  state: WorkerRuntimeState,
  input?: { nowMs?: number; staleAfterMs?: number },
) {
  const readiness = buildWorkerReadinessSnapshot(state, input);
  return {
    statusCode: readiness.ok ? 200 : 503,
    body: readiness,
  };
}

export async function startArtifactServer(input?: {
  getRuntimeState?: () => WorkerRuntimeState;
  staleAfterMs?: number;
}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/health") {
      if (input?.getRuntimeState) {
        const response = buildWorkerHealthResponse(input.getRuntimeState(), {
          staleAfterMs: input.staleAfterMs,
        });
        res.writeHead(response.statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response.body));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/ready") {
      if (!input?.getRuntimeState) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, ready: true }));
        return;
      }

      const response = buildWorkerReadyResponse(input.getRuntimeState(), {
        staleAfterMs: input.staleAfterMs,
      });
      res.writeHead(response.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response.body));
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

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`[artifact-server] listening on port ${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });

  return {
    async stop() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
