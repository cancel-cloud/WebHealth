import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultWorkerRoot = path.resolve(__dirname, "..");
const defaultRepoRoot = path.resolve(__dirname, "../../..");

function loadIfExists(filePath: string, env: NodeJS.ProcessEnv) {
  if (!existsSync(filePath)) return;
  loadDotenv({ path: filePath, override: false, processEnv: env });
}

export function loadWorkerEnv({
  env = process.env,
  repoRoot = defaultRepoRoot,
  workerRoot = defaultWorkerRoot,
}: {
  env?: NodeJS.ProcessEnv;
  repoRoot?: string;
  workerRoot?: string;
} = {}) {
  const explicitFile = env.WORKER_ENV_FILE;
  if (explicitFile) {
    loadIfExists(path.resolve(explicitFile), env);
  }

  // Worker-local files should win over repo-root defaults.
  loadIfExists(path.join(workerRoot, ".env.local"), env);
  loadIfExists(path.join(workerRoot, ".env"), env);
  loadIfExists(path.join(repoRoot, ".env.local"), env);
  loadIfExists(path.join(repoRoot, ".env"), env);

  if (!env.DATABASE_URL) {
    throw new Error("DB_CONFIG_ERROR: DATABASE_URL is required for worker runtime.");
  }
}
