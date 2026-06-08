import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { applyTrendsFixture } from "./fixtures/trends-fixture";
import { PrismaClient } from "@prisma/client";

const AUTH_STATE = path.join(__dirname, ".auth", "state.json");

/**
 * One-time setup, run before the phone projects:
 *   1. Apply the deterministic trends fixture (dev-only, local-DB-guarded).
 *   2. Log in with the admin credentials from .env and persist storageState so
 *      the chromium-phone / webkit-phone projects start authenticated.
 */

setup("apply fixture", async () => {
  const prisma = new PrismaClient();
  try {
    const { inserted } = await applyTrendsFixture(prisma);
    expect(inserted).toBeGreaterThan(0);
  } finally {
    await prisma.$disconnect();
  }
});

setup("authenticate", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  // Successful login redirects off /login to the app home.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });

  fs.mkdirSync(path.dirname(AUTH_STATE), { recursive: true });
  await page.context().storageState({ path: AUTH_STATE });
});
