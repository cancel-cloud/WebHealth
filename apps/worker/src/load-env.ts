import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { resolveWorkerEnvSearchPaths } from "./runtime-paths";

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
  repoRoot,
  workerRoot,
}: {
  env?: NodeJS.ProcessEnv;
  repoRoot?: string;
  workerRoot?: string;
} = {}) {
  const explicitFile = env.WORKER_ENV_FILE;
  if (explicitFile) {
    loadIfExists(path.resolve(explicitFile), env);
  }

  const searchPaths = resolveWorkerEnvSearchPaths(__dirname);
  const workerRoots = workerRoot ? [workerRoot] : searchPaths.workerRoots;
  const repoRoots = repoRoot ? [repoRoot] : searchPaths.repoRoots;

  // Worker-local files should win over repo-root defaults.
  for (const root of workerRoots) {
    loadIfExists(path.join(root, ".env.local"), env);
    loadIfExists(path.join(root, ".env"), env);
  }
  for (const root of repoRoots) {
    loadIfExists(path.join(root, ".env.local"), env);
    loadIfExists(path.join(root, ".env"), env);
  }

  if (!env.DATABASE_URL) {
    throw new Error("DB_CONFIG_ERROR: DATABASE_URL is required for worker runtime.");
  }
}
