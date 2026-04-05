import { cp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distRoot = path.join(repoRoot, "dist");
const workerEntry = path.join(repoRoot, "apps", "worker", "src", "main.ts");

function sortObjectEntries(input) {
  return Object.fromEntries(
    Object.entries(input).sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeRuntimeManifest() {
  const rootPackage = await readJson(path.join(repoRoot, "package.json"));
  const workerPackage = await readJson(path.join(repoRoot, "apps", "worker", "package.json"));
  const sharedPackage = await readJson(path.join(repoRoot, "packages", "shared", "package.json"));

  const runtimeDependencies = getRuntimeDependencies(workerPackage, sharedPackage);

  const manifest = {
    name: "@webhealth/worker-runtime",
    private: true,
    type: "module",
    packageManager: rootPackage.packageManager,
    engines: workerPackage.engines,
    main: "./apps/worker/src/main.js",
    scripts: {
      start: "node ./apps/worker/src/main.js",
      "start:once": "node ./apps/worker/src/main.js --once",
    },
    dependencies: sortObjectEntries(runtimeDependencies),
  };

  await writeFile(
    path.join(distRoot, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

function getRuntimeDependencies(workerPackage, sharedPackage) {
  const runtimeDependencies = {
    ...sharedPackage.dependencies,
    ...workerPackage.dependencies,
  };
  delete runtimeDependencies["@webhealth/shared"];
  return runtimeDependencies;
}

const workerPackage = await readJson(path.join(repoRoot, "apps", "worker", "package.json"));
const sharedPackage = await readJson(path.join(repoRoot, "packages", "shared", "package.json"));
const runtimeDependencies = getRuntimeDependencies(workerPackage, sharedPackage);

await rm(distRoot, { recursive: true, force: true });

await build({
  entryPoints: [workerEntry],
  absWorkingDir: repoRoot,
  outdir: distRoot,
  outbase: repoRoot,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node20",
  tsconfig: path.join(repoRoot, "apps", "worker", "tsconfig.json"),
  external: Object.keys(runtimeDependencies),
  entryNames: "[dir]/[name]",
  chunkNames: "apps/worker/src/chunks/[name]-[hash]",
  legalComments: "none",
  logLevel: "info",
});

await cp(path.join(repoRoot, "drizzle"), path.join(distRoot, "drizzle"), {
  recursive: true,
});
await cp(
  path.join(repoRoot, "apps", "worker", ".env.example"),
  path.join(distRoot, "apps", "worker", ".env.example"),
);
await writeRuntimeManifest();
