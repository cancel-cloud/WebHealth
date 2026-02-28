import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: {
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/lib/properties/reportable-properties.test.ts",
      "src/lib/queue/report-job-row-shape.test.ts",
      "src/lib/reports/ai-report-schema.test.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
