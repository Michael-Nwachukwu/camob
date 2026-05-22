import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Playwright tests live under tests/e2e and have their own runner.
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname)
    }
  }
});
