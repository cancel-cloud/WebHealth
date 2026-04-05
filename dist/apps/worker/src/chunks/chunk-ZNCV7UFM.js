// ../../packages/shared/src/lib/reports/artifacts/store.ts
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";
var LocalFilesystemArtifactStore = class {
  constructor(rootDir = process.env.REPORT_ARTIFACTS_DIR || path.join(process.cwd(), "artifacts")) {
    this.rootDir = rootDir;
  }
  async put(input) {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = path.posix.join("reports", input.reportId, `${Date.now()}-${safeFileName}`);
    const absPath = path.join(this.rootDir, key);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, input.buffer);
    return {
      key,
      // Local route will map this key via /api/reports/[id]/download
      url: `/api/reports/${input.reportId}/download`
    };
  }
  async getDownloadRef(key) {
    const absPath = path.join(this.rootDir, key);
    await stat(absPath);
    return { path: absPath };
  }
};
var singleton = null;
function getArtifactStore() {
  singleton ??= new LocalFilesystemArtifactStore();
  return singleton;
}

export {
  getArtifactStore
};
