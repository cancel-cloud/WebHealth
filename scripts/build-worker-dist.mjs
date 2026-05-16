import { cp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distRoot = path.join(repoRoot, "dist");
const workerEntry = path.join(repoRoot, "apps", "worker", "src", "main.ts");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeRuntimeManifest() {
  const rootPackage = await readJson(path.join(repoRoot, "package.json"));
  const workerPackage = await readJson(path.join(repoRoot, "apps", "worker", "package.json"));

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
    dependencies: {},
  };

  await writeFile(
    path.join(distRoot, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

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
  target: "node24",
  tsconfig: path.join(repoRoot, "apps", "worker", "tsconfig.json"),
  entryNames: "[dir]/[name]",
  chunkNames: "apps/worker/src/chunks/[name]-[hash]",
  banner: {
    js: [
      'import { createRequire } from "node:module";',
      "const require = createRequire(import.meta.url);",
    ].join(" "),
  },
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
