import { createServer, type Server } from "node:http";

import { buildWorkerReadinessSnapshot, type WorkerRuntimeState } from "./runtime-state";

export type WorkerHealthServer = {
  port: number;
  close: () => Promise<void>;
};

export function startWorkerHealthServer(input: {
  state: WorkerRuntimeState;
  port?: number;
  host?: string;
  staleAfterMs?: number;
}): WorkerHealthServer {
  const port = input.port ?? parseInt(process.env.WORKER_HEALTH_PORT ?? "9100", 10);
  const host = input.host ?? process.env.WORKER_HEALTH_HOST ?? "0.0.0.0";
  const staleAfterMs = input.staleAfterMs ?? parseInt(process.env.WORKER_HEALTH_STALE_AFTER_MS ?? "60000", 10);

  const server = createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end("OK\n");
      return;
    }

    if (request.url === "/ready") {
      const snapshot = buildWorkerReadinessSnapshot(input.state, { staleAfterMs });
      if (snapshot.ok) {
        response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        response.end("OK\n");
        return;
      }

      response.writeHead(503, { "content-type": "application/json; charset=utf-8" });
      response.end(`${JSON.stringify(snapshot)}\n`);
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  });

  server.listen(port, host);
  server.on("listening", () => {
    const address = server.address();
    const resolvedPort = typeof address === "object" && address ? address.port : port;
    console.log(`[worker][INFO][HEALTH] listening host=${host} port=${resolvedPort}`);
  });

  return {
    port,
    close: () => closeServer(server),
  };
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
