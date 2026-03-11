/**
 * Generates apps/web/public/og-image.png (1200x630)
 *
 * Usage:
 *   node scripts/generate-og-image.mjs <screenshot-file>
 *
 * The screenshot is composited into a branded card:
 *   - Indigo (#6366f1) gradient background
 *   - Product name + tagline on the left
 *   - Screenshot preview panel on the right
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const [, , screenshotArg] = process.argv;
if (!screenshotArg) {
  console.error("Usage: node scripts/generate-og-image.mjs <screenshot-file>");
  process.exit(1);
}

const screenshotPath = path.resolve(ROOT, screenshotArg);
if (!fs.existsSync(screenshotPath)) {
  console.error(`File not found: ${screenshotPath}`);
  process.exit(1);
}

const OUT_PATH = path.resolve(ROOT, "apps/web/public/og-image.png");
const W = 1200;
const H = 630;

// ── Layout constants ──────────────────────────────────────────────────────────
const PAD = 64;
const TEXT_COL_W = 420;
const PREVIEW_X = PAD + TEXT_COL_W + 40;
const PREVIEW_W = W - PREVIEW_X - 32;
const PREVIEW_H = H - 64;
const PREVIEW_Y = 32;

// ── SVG background + text layer ───────────────────────────────────────────────
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1117"/>
      <stop offset="100%" stop-color="#1a1f2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <clipPath id="previewClip">
      <rect x="${PREVIEW_X}" y="${PREVIEW_Y}" width="${PREVIEW_W}" height="${PREVIEW_H}" rx="12"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Subtle grid lines -->
  <rect width="${W}" height="${H}" fill="none" stroke="#ffffff06" stroke-width="1"/>

  <!-- Accent bar -->
  <rect x="${PAD}" y="${PAD}" width="48" height="4" rx="2" fill="url(#accent)"/>

  <!-- Product name -->
  <text x="${PAD}" y="${PAD + 52}" font-family="system-ui, -apple-system, sans-serif"
        font-size="38" font-weight="800" fill="#ffffff" letter-spacing="-1">Webhealth</text>

  <!-- Tagline line 1 -->
  <text x="${PAD}" y="${PAD + 106}" font-family="system-ui, -apple-system, sans-serif"
        font-size="22" font-weight="600" fill="#6366f1">GSC + GA4 data.</text>

  <!-- Tagline line 2 -->
  <text x="${PAD}" y="${PAD + 136}" font-family="system-ui, -apple-system, sans-serif"
        font-size="22" font-weight="600" fill="#ffffff">Ranked fixes in 3 min.</text>

  <!-- Description -->
  <text x="${PAD}" y="${PAD + 188}" font-family="system-ui, -apple-system, sans-serif"
        font-size="15" fill="#94a3b8">AI-ranked SEO fixes with affected</text>
  <text x="${PAD}" y="${PAD + 210}" font-family="system-ui, -apple-system, sans-serif"
        font-size="15" fill="#94a3b8">URLs and impact scores.</text>

  <!-- CTA pill -->
  <rect x="${PAD}" y="${PAD + 242}" width="160" height="36" rx="18" fill="#6366f1"/>
  <text x="${PAD + 80}" y="${PAD + 265}" font-family="system-ui, -apple-system, sans-serif"
        font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle">Free to start →</text>

  <!-- Preview panel border -->
  <rect x="${PREVIEW_X - 1}" y="${PREVIEW_Y - 1}" width="${PREVIEW_W + 2}" height="${PREVIEW_H + 2}"
        rx="13" fill="none" stroke="#6366f130" stroke-width="1.5"/>

  <!-- Preview placeholder (will be replaced by screenshot composite) -->
  <rect x="${PREVIEW_X}" y="${PREVIEW_Y}" width="${PREVIEW_W}" height="${PREVIEW_H}"
        rx="12" fill="#1e2433"/>

  <!-- Domain badge -->
  <rect x="${PAD}" y="${H - PAD - 24}" width="180" height="24" rx="12" fill="#ffffff0d"/>
  <text x="${PAD + 90}" y="${H - PAD - 8}" font-family="system-ui, -apple-system, sans-serif"
        font-size="12" fill="#64748b" text-anchor="middle">webhealth.devbrew.dev</text>
</svg>`;

// ── Composite screenshot into preview panel ───────────────────────────────────
async function run() {
  console.log(`Reading screenshot: ${screenshotPath}`);

  // Resize screenshot to fit the preview panel (crop top portion — most useful)
  const previewBuf = await sharp(screenshotPath)
    .resize(PREVIEW_W, PREVIEW_H, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // Apply rounded corners mask to screenshot
  const roundedMask = Buffer.from(
    `<svg><rect x="0" y="0" width="${PREVIEW_W}" height="${PREVIEW_H}" rx="12" ry="12"/></svg>`
  );

  const maskedPreview = await sharp(previewBuf)
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // Composite everything
  await sharp(Buffer.from(svg))
    .resize(W, H)
    .composite([
      {
        input: maskedPreview,
        top: PREVIEW_Y,
        left: PREVIEW_X,
      },
    ])
    .png()
    .toFile(OUT_PATH);

  console.log(`✓ OG image written to: ${OUT_PATH}`);
  console.log(`  Size: 1200×630px`);
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
