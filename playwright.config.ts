import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env so the setup project (Prisma + login credentials) sees DATABASE_URL,
// ADMIN_EMAIL and ADMIN_PASSWORD — same file Next loads for the dev server.
dotenv.config({ path: ".env" });

/**
 * Playwright config for Molly's trends/report verification harness.
 *
 * Mobile-first: the primary projects run at PHONE viewports (Pixel 7 on
 * Chromium, iPhone 13 on WebKit) — the real surface for this PWA. A `setup`
 * project applies the deterministic fixture, logs in, and saves storageState
 * so the phone projects start authenticated.
 *
 * Screenshots: `screenshot: "on"` keeps Playwright's own per-test captures, and
 * the specs additionally write explicit, named PNGs to e2e/__screenshots__/.
 */

const AUTH_STATE = "e2e/.auth/state.json";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],

  use: {
    baseURL: "http://localhost:3000",
    screenshot: "on",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts$/,
    },
    {
      name: "chromium-phone",
      use: {
        ...devices["Pixel 7"],
        storageState: AUTH_STATE,
      },
      dependencies: ["setup"],
      testIgnore: /global\.setup\.ts$/,
    },
    {
      name: "webkit-phone",
      use: {
        ...devices["iPhone 13"],
        storageState: AUTH_STATE,
      },
      dependencies: ["setup"],
      testIgnore: /global\.setup\.ts$/,
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
