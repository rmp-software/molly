/**
 * Apply pending Prisma migrations to PRODUCTION.
 *
 * Loads DATABASE_URL from `.env.production.local` (gitignored) and runs
 * `prisma migrate deploy` — the safe prod command: it only applies pending
 * migrations, never resets the database and never generates new ones.
 *
 *   npm run migrate:prod         # shows pending migrations, then prompts
 *   npm run migrate:prod -- --yes  # skip the prompt (CI / non-interactive)
 *
 * Safety notes:
 *  - We load the prod env with `override: true` so a DATABASE_URL already in the
 *    shell can't shadow it. Prisma also auto-loads `.env` (dev), but dotenv does
 *    NOT override an already-set variable, so the prod URL set here wins.
 *  - The script never prints the password — only a masked user@host/db summary.
 */

import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ENV_FILE = ".env.production.local";

if (!existsSync(ENV_FILE)) {
  console.error(`✗ ${ENV_FILE} not found in ${process.cwd()}.`);
  process.exit(1);
}

const { error } = dotenv.config({ path: ENV_FILE, override: true });
if (error) {
  console.error(`✗ Failed to load ${ENV_FILE}: ${error.message}`);
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(`✗ DATABASE_URL is not set in ${ENV_FILE}.`);
  process.exit(1);
}

/** user@host:port/db — never reveals the password. */
function maskedTarget(url) {
  try {
    const u = new URL(url);
    const db = u.pathname.replace(/^\//, "");
    return `${u.username ? `${u.username}@` : ""}${u.host}/${db}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function runPrisma(args) {
  return spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
}

console.log("Prisma migrate deploy → PRODUCTION");
console.log(`  env file : ${ENV_FILE}`);
console.log(`  target   : ${maskedTarget(dbUrl)}\n`);

// Show what's pending first (migrate status exits non-zero when there are
// unapplied migrations — that's expected here, so we don't gate on its code).
console.log("Migration status:");
runPrisma(["migrate", "status"]);
console.log("");

const skipPrompt =
  process.argv.includes("--yes") || process.argv.includes("-y");

if (!skipPrompt) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    `Apply pending migrations to ${maskedTarget(dbUrl)}? (type "yes") `
  );
  rl.close();
  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Aborted — no migrations applied.");
    process.exit(0);
  }
}

const result = runPrisma(["migrate", "deploy"]);
process.exit(result.status ?? 1);
