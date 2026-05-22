import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Pixel 5 is chromium-based, so we don't need to install WebKit just for
    // mobile viewport testing — the same chromium binary handles both.
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ],
  webServer: {
    // `next dev` keeps NODE_ENV=development, which means the plaintext
    // ADMIN_PASSWORD fallback works (production blocks it via
    // instrumentation.ts). We rely on the in-memory repository fallback,
    // so no DATABASE_URL is needed.
    command: `PORT=${PORT} NEXTAUTH_URL=${BASE_URL} npm run dev`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
