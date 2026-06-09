# E2E + visual verification harness (trends / report)

Phone-sized Playwright suite that verifies the Trends and Report surfaces against a
committed, deterministic seizure-episode fixture. Runs on **WebKit (iPhone 13)** and
**Chromium (Pixel 7)** — the mobile-first surfaces for this PWA.

## Prerequisites

1. **Local Postgres up** (Docker, port 5433):
   ```bash
   docker compose up -d
   ```
2. **Schema + base seed applied** (creates the admin user + dog "Molly"):
   ```bash
   npx prisma migrate dev   # or: ./init.sh
   npx prisma db seed
   ```
3. **Playwright browsers installed** (one-time):
   ```bash
   npx playwright install chromium webkit
   ```
   Login + DB creds come from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL`).

## Running

```bash
npm run test:e2e          # = playwright test
```

What happens:
- The `setup` project applies the fixture (`e2e/fixtures/trends-fixture.ts`), logs in,
  and saves auth state to `e2e/.auth/state.json` (gitignored).
- The `chromium-phone` and `webkit-phone` projects depend on `setup` and reuse that
  auth state.
- Playwright starts `npm run dev` automatically (`reuseExistingServer` locally), so no
  separate dev server is needed. First Turbopack compile is slow — the webServer
  timeout is generous.

Run a single project:
```bash
npx playwright test --project=webkit-phone
npx playwright test --project=chromium-phone
```

## The fixture

`e2e/fixtures/trends-fixture.ts` resets **only** Molly's `seizureEpisode` rows (admin
user + dog are kept) and inserts a canonical set with **FIXED** dates anchored around
2026-06 (the app's current date). It is **dev-only**: it asserts `DATABASE_URL` is local
(`localhost` / `127.0.0.1` / `:5433`) and throws otherwise. Idempotent: clean-then-insert.

Apply it manually (without running the suite):
```bash
npx tsx e2e/fixtures/trends-fixture.ts
```

Window boundaries the app derives from `now = 2026-06-08`:
`3m → 2026-03-08`, `6m → 2025-12-08`, `12m → 2025-06-08`, `Tudo → 2024-01-05` (first episode).

The dataset covers, by design:
- **Multiple types in one period** (tonic_clonic + focal + absence in the 3m window) →
  stacked bars + present-types-only legend.
- **tonic_clonic durations under AND ≥60s** (e.g. 38s, 120s, 75s) → 60s threshold line,
  danger dots, emergency count, and a non-null `previousAvg` delta ("vs anterior").
- **An empty month** (May 2026 has no episodes) → empty bucket / line gap.
- **"Outra" (other) only in Tudo** (the single `other` episode is 2024-03-18) → absent in
  3m/6m/12m, present in Tudo.
- **Floor anchor 2024-01-05** → "Tudo" floors at 2024, never 2000.

## Screenshots

Each test run writes named PNGs to `e2e/__screenshots__/` (gitignored), one set per
project:
- `trends-3m-<project>.png`, `trends-6m-<project>.png`, `trends-12m-<project>.png`,
  `trends-tudo-<project>.png`
- `report-<project>.png`

where `<project>` is `chromium-phone` or `webkit-phone`. Playwright also keeps its own
per-test screenshots/traces under `test-results/` (gitignored).
