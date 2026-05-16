import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distRoot = path.join(repoRoot, "dist");

async function hashFile(filePath) {
  return createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");
}

async function snapshotDirectory(root, current = root, snapshot = new Map()) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (entry.isDirectory()) {
      await snapshotDirectory(root, fullPath, snapshot);
      continue;
    }
    if (!entry.isFile()) continue;
    const fileStat = await stat(fullPath);
    snapshot.set(relativePath, {
      size: fileStat.size,
      hash: await hashFile(fullPath),
    });
  }
  return snapshot;
}

function diffSnapshots(before, after) {
  const paths = new Set([...before.keys(), ...after.keys()]);
  const changes = [];
  for (const filePath of [...paths].sort()) {
    const beforeFile = before.get(filePath);
    const afterFile = after.get(filePath);
    if (!beforeFile) {
      changes.push(`A ${filePath}`);
    } else if (!afterFile) {
      changes.push(`D ${filePath}`);
    } else if (beforeFile.size !== afterFile.size || beforeFile.hash !== afterFile.hash) {
      changes.push(`M ${filePath}`);
    }
  }
  return changes;
}

const before = await snapshotDirectory(distRoot);

execFileSync("node", ["./scripts/build-worker-dist.mjs"], {
  cwd: repoRoot,
  stdio: "inherit",
});

const after = await snapshotDirectory(distRoot);
const changes = diffSnapshots(before, after);

if (changes.length > 0) {
  console.error("Worker dist bundle is stale. Rebuild with `pnpm worker:build-dist` and commit the updated `dist/` files.");
  console.error(changes.join("\n"));
  process.exit(1);
}
