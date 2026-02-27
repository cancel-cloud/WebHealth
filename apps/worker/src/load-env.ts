import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(__dirname, "../../..");

function loadIfExists(filePath: string) {
  if (!existsSync(filePath)) return;
  loadDotenv({ path: filePath, override: false });
}

export function loadWorkerEnv() {
  const explicitFile = process.env.WORKER_ENV_FILE;
  if (explicitFile) {
    loadIfExists(path.resolve(explicitFile));
  }

  loadIfExists(path.join(repoRoot, ".env.local"));
  loadIfExists(path.join(repoRoot, ".env"));
  loadIfExists(path.join(workerRoot, ".env.local"));
  loadIfExists(path.join(workerRoot, ".env"));

  if (!process.env.DATABASE_URL) {
    throw new Error("DB_CONFIG_ERROR: DATABASE_URL is required for worker runtime.");
  }
}
