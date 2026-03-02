import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";

export type ArtifactPutInput = {
  reportId: string;
  kind: "xlsx" | "json" | "debug";
  fileName: string;
  contentType: string;
  buffer: Buffer;
};

export type ArtifactRef = {
  key: string;
  url: string;
};

export interface ArtifactStore {
  put(input: ArtifactPutInput): Promise<ArtifactRef>;
  getDownloadRef(key: string): Promise<{ url?: string; path?: string }>;
}

export class LocalFilesystemArtifactStore implements ArtifactStore {
  constructor(private readonly rootDir: string = process.env.REPORT_ARTIFACTS_DIR || path.join(process.cwd(), "artifacts")) {}

  async put(input: ArtifactPutInput): Promise<ArtifactRef> {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = path.posix.join("reports", input.reportId, `${Date.now()}-${safeFileName}`);
    const absPath = path.join(this.rootDir, key);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, input.buffer);
    return {
      key,
      // Local route will map this key via /api/reports/[id]/download
      url: `/api/reports/${input.reportId}/download`,
    };
  }

  async getDownloadRef(key: string): Promise<{ url?: string; path?: string }> {
    const absPath = path.join(this.rootDir, key);
    await stat(absPath);
    return { path: absPath };
  }
}

let singleton: ArtifactStore | null = null;

export function getArtifactStore(): ArtifactStore {
  singleton ??= new LocalFilesystemArtifactStore();
  return singleton;
}
