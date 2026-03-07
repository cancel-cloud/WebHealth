import { readFile } from "node:fs/promises";
import { getArtifactStore } from "@webhealth/shared/lib/reports/artifacts/store";

type WorkerFetchImpl = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Pick<Response, "ok" | "status" | "arrayBuffer">>;

type ResolveOptions = {
  artifactKey: string;
  workerBaseUrl?: string;
  artifactToken?: string;
  readLocalArtifact?: (artifactKey: string) => Promise<ArrayBuffer | null>;
  fetchImpl?: WorkerFetchImpl;
};

type ResolveSuccess = {
  ok: true;
  data: ArrayBuffer;
};

type ResolveFailure = {
  ok: false;
  status: number;
  code: string;
  error: string;
};

export type ResolveReportArtifactResult = ResolveSuccess | ResolveFailure;

async function readLocalArtifactFromStore(artifactKey: string): Promise<ArrayBuffer | null> {
  try {
    const ref = await getArtifactStore().getDownloadRef(artifactKey);
    if (!ref.path) return null;
    const file = await readFile(ref.path);
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  } catch {
    return null;
  }
}

export async function resolveReportArtifactBinary(
  options: ResolveOptions
): Promise<ResolveReportArtifactResult> {
  const readLocalArtifact = options.readLocalArtifact ?? readLocalArtifactFromStore;
  const fetchImpl = options.fetchImpl ?? fetch;

  const localData = await readLocalArtifact(options.artifactKey);
  if (localData) {
    return { ok: true, data: localData };
  }

  if (!options.workerBaseUrl || !options.artifactToken) {
    return {
      ok: false,
      status: 503,
      code: "ARTIFACT_SERVICE_UNAVAILABLE",
      error: "Artifact download service not configured",
    };
  }

  const artifactUrl = new URL("/artifacts", options.workerBaseUrl);
  artifactUrl.searchParams.set("token", options.artifactToken);

  try {
    const response = await fetchImpl(artifactUrl.toString());

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502;
      return {
        ok: false,
        status,
        code: status === 404 ? "ARTIFACT_NOT_FOUND" : "ARTIFACT_FETCH_FAILED",
        error:
          status === 404 ? "Artifact not found" : "Failed to fetch artifact from worker",
      };
    }

    return { ok: true, data: await response.arrayBuffer() };
  } catch {
    return {
      ok: false,
      status: 502,
      code: "ARTIFACT_WORKER_UNREACHABLE",
      error: "Failed to reach artifact download worker",
    };
  }
}
