import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

execFileSync("node", ["./scripts/build-worker-dist.mjs"], {
  cwd: repoRoot,
  stdio: "inherit",
});

const status = execFileSync("git", ["status", "--short", "--", "dist"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();

if (status) {
  console.error("Worker dist bundle is stale. Rebuild with `pnpm worker:build-dist` and commit the updated `dist/` files.");
  console.error(status);
  process.exit(1);
}
