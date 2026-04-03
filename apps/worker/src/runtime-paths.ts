import path from "node:path";

export type WorkerEnvSearchPaths = {
  workerRoots: string[];
  repoRoots: string[];
};

function findDistRoot(moduleDir: string): string | null {
  let current = moduleDir;

  while (true) {
    if (path.basename(current) === "dist") {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export function resolveWorkerEnvSearchPaths(moduleDir: string): WorkerEnvSearchPaths {
  const distRoot = findDistRoot(moduleDir);
  if (distRoot) {
    const sourceRepoRoot = path.dirname(distRoot);
    return {
      workerRoots: [
        path.join(distRoot, "apps", "worker"),
        path.join(sourceRepoRoot, "apps", "worker"),
      ],
      repoRoots: [distRoot, sourceRepoRoot],
    };
  }

  const workerRoot = path.resolve(moduleDir, "..");
  const repoRoot = path.resolve(moduleDir, "../../..");

  return {
    workerRoots: [workerRoot],
    repoRoots: [repoRoot],
  };
}
