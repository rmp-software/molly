import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

/**
 * /trends — phone-sized verification across the four ranges (3m/6m/12m/Tudo) plus
 * a Mês/Semana toggle, against the committed deterministic fixture.
 *
 * Fixture facts this spec relies on (see e2e/fixtures/trends-fixture.ts).
 * Window boundaries the client derives from now = 2026-06-08:
 *   3m → from 2026-03-08   6m → from 2025-12-08   12m → from 2025-06-08
 *   Tudo → from firstEpisode (2024-01-05).
 *
 * Expected values DERIVED from FIXTURE_EPISODES (counts of episodes whose
 * occurredAt falls in [from, now)):
 *  • 3m present types: tonic_clonic, focal, absence (NO "other"/"Outra").
 *    byType counts → tonic_clonic 4, focal 2, absence 1. emergencyCount (tc
 *    durationSeconds>=60) = 2 (2026-04-09 @120s, 2026-06-02 @75s).
 *    Previous 3m window [2025-12-08, 2026-03-08) has tc durations 42 & 48 →
 *    previousAvg non-null → "vs anterior" present.
 *  • 6m present types: tonic_clonic, focal, absence. byType → tonic_clonic 6,
 *    absence 2, focal 2. Three distinct types → ≥2 stacked segment fills + ≥2
 *    legend rows.
 *  • The ONLY `other`/"Outra" episode is 2024-03-18 → ABSENT from 3m/6m/12m,
 *    PRESENT only in Tudo.
 *  • Earliest episode 2024-01-05 → "Tudo" floors at 2024, never 2000.
 */

const SHOT_DIR = path.join(__dirname, "__screenshots__");

// `var(--chart-type-*)` fills the stacked <Bar> rects carry (see
// lib/seizure-types.ts TYPE_COLOR_VAR). Used to count DISTINCT stacked series.
const TYPE_FILL_RE = /var\(--chart-type-[a-z-]+\)/;

test.beforeAll(() => {
  // CI-safety: the screenshot dir may not exist on a fresh clone. Mirror how
  // global.setup.ts creates e2e/.auth/ before writing into it.
  fs.mkdirSync(SHOT_DIR, { recursive: true });
});

// Range chips are pill buttons with aria-pressed; the bucket toggle too.
function rangeChip(page: Page, name: "3m" | "6m" | "12m" | "Tudo") {
  return page.getByRole("button", { name, exact: true });
}

// The frequency card: the one container that has the "Frequência de crises"
// heading. Scoping legend/breakdown assertions here keeps them from matching the
// page-global "Registros recentes" list (which would make them tautological).
function freqCard(page: Page) {
  return page
    .locator("div")
    .filter({
      has: page.getByRole("heading", { name: "Frequência de crises" }),
    })
    .first();
}

/**
 * Robust range switch. The component sets aria-busy=true only inside
 * fetchStats(setLoading(true)), which runs in the same click handler tick AFTER
 * setRangeKey re-renders — so naively waiting for aria-busy="false" can resolve
 * on the STALE-range render before the refetch even starts. Tie the wait to the
 * actual /api/seizures/stats response that the click triggers, so the range's
 * own data is guaranteed loaded before any assertion reads it.
 */
async function selectRange(page: Page, name: "3m" | "6m" | "12m" | "Tudo") {
  const chip = rangeChip(page, name);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/seizures/stats") && r.ok()
    ),
    chip.click(),
  ]);
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  // Busy overlay must have lifted too (defensive — the response above already
  // settled the state).
  await expect(page.locator('[aria-busy="false"]').first()).toBeVisible();
}

/** Same robustness for the Mês/Semana bucket toggle. */
async function selectBucket(page: Page, name: "Mês" | "Semana") {
  const chip = page.getByRole("button", { name, exact: true });
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/seizures/stats") && r.ok()
    ),
    chip.click(),
  ]);
  await expect(chip).toHaveAttribute("aria-pressed", "true");
}

/** Count distinct `var(--chart-type-*)` fills among the chart's bar elements. */
async function distinctTypeFills(page: Page): Promise<number> {
  const svg = freqCard(page).locator("svg").first();
  await expect(svg).toBeVisible();
  // Recharts paints stacked <Bar> segments as <path>/<rect> carrying the series
  // `var(--chart-type-*)` fill. WebKit can lag a frame after the data lands, so
  // wait for the painted segments to exist before reading — otherwise the very
  // first read (default 6m, no preceding refetch) can see zero rects. Poll the
  // distinct-fill count itself so we settle on the real, fully-painted value.
  const read = () =>
    svg
      .locator("path[fill], rect[fill]")
      .evaluateAll((els) => {
        const fills = els
          .map((el) => el.getAttribute("fill") ?? "")
          .filter((f) => f.includes("--chart-type-"));
        return [...new Set(fills)];
      });
  await expect
    .poll(async () => (await read()).length, { timeout: 5_000 })
    .toBeGreaterThan(0);
  const fills = await read();
  return new Set(fills.filter((f) => TYPE_FILL_RE.test(f))).size;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/trends");
  await expect(
    page.getByRole("heading", { name: "Frequência de crises" })
  ).toBeVisible();
});

test("range chips + bucket toggle render the STACKED frequency chart", async ({
  page,
}) => {
  // Default range is 6m.
  await expect(rangeChip(page, "6m")).toHaveAttribute("aria-pressed", "true");

  // Stacked-mode proof: the chart must paint ≥2 DISTINCT per-type series fills.
  // A regression to a single (non-stacked) series would yield ≤1 and fail here.
  // 6m fixture has tonic_clonic + focal + absence present → ≥2 distinct fills.
  expect(await distinctTypeFills(page)).toBeGreaterThanOrEqual(2);

  // Bucket toggle: Semana then back to Mês (each waits for its own refetch).
  await selectBucket(page, "Semana");
  await selectBucket(page, "Mês");
  // Still stacked after toggling back.
  expect(await distinctTypeFills(page)).toBeGreaterThanOrEqual(2);
});

test("legend (scoped to freq card) lists multiple present types + Por tipo rows", async ({
  page,
}) => {
  await selectRange(page, "6m");
  const card = freqCard(page);

  // Legend lives inside the freq card (the <ul> below the chart). Scope the
  // type-label assertions to the card so they cannot be satisfied by the
  // "Registros recentes" list elsewhere on the page.
  await expect(card.getByText("Tônico-clônica").first()).toBeVisible();
  await expect(card.getByText("Focal").first()).toBeVisible();
  await expect(card.getByText("Ausência").first()).toBeVisible();

  // ≥2 distinct stacked fills also corroborates a real multi-series legend.
  expect(await distinctTypeFills(page)).toBeGreaterThanOrEqual(2);

  // "Por tipo" TypeBreakdown section present with the expected present-type rows
  // and their fixture-derived counts (6m: tonic_clonic 6, absence 2, focal 2).
  await expect(card.getByRole("heading", { name: "Por tipo" })).toBeVisible();
  const breakdown = card.locator("ul").last();
  // Each row renders the label + a numeric count cell. Assert the rows exist for
  // the three present types and that the dominant type shows its count of 6.
  await expect(breakdown.getByText("Tônico-clônica")).toBeVisible();
  await expect(breakdown.getByText("Focal")).toBeVisible();
  await expect(breakdown.getByText("Ausência")).toBeVisible();
  await expect(breakdown.getByText("6", { exact: true })).toBeVisible();
  // "Outra" is NOT a present type in 6m → no breakdown row for it.
  await expect(card.getByText("Outra")).toHaveCount(0);
});

test("present-types-only: 'Outra' absent in 3m, present in Tudo", async ({
  page,
}) => {
  // 3m window has NO `other` episode → "Outra" must not appear in the freq card.
  await selectRange(page, "3m");
  const card = freqCard(page);
  await expect(card.getByText("Tônico-clônica").first()).toBeVisible();
  await expect(card.getByText("Outra")).toHaveCount(0);
  // 3m present types tonic_clonic/focal/absence → still ≥2 distinct stacks.
  expect(await distinctTypeFills(page)).toBeGreaterThanOrEqual(2);

  // Tudo includes the 2024-03-18 `other` episode → "Outra" appears in the card.
  await selectRange(page, "Tudo");
  await expect(freqCard(page).getByText("Outra").first()).toBeVisible();
});

test("Tudo floors at 2024, not 2000", async ({ page }) => {
  await selectRange(page, "Tudo");
  // The range header under "Frequência de crises" reflects the floor. The
  // earliest fixture episode is 2024-01-05, so the header must mention 2024 and
  // must NOT show a pre-2024 / year-2000 floor.
  const card = freqCard(page);
  await expect(card).toContainText("2024");
  await expect(card).not.toContainText("2000");
});

test("duration card: threshold line, exact emergency count (2 in 3m) and delta", async ({
  page,
}) => {
  await selectRange(page, "3m");
  const durCard = page
    .locator("div")
    .filter({
      has: page.getByRole("heading", {
        name: "Duração das crises tônico-clônicas",
      }),
    })
    .first();
  await expect(durCard).toBeVisible();

  // 60s reference line label.
  await expect(page.getByText("1 min — emergência").first()).toBeVisible();

  // Emergency count: 3m has exactly 2 tonic_clonic episodes with durationSeconds
  // >= 60 (2026-04-09 @120s, 2026-06-02 @75s) → "2 crises acima de 1 min".
  // Asserting the exact "2 ..." string means a regression to 0 (the count
  // dropping out, or the >=60 filter breaking) turns this RED — the label-only
  // assertion would have stayed green.
  await expect(
    durCard.getByText("2 crises acima de 1 min", { exact: true })
  ).toBeVisible();

  // Delta vs the previous equal-length window. The previous 3m window
  // [2025-12-08, 2026-03-08) has tonic_clonic durations 42 & 48 → previousAvg is
  // non-null, so a concrete "▲ … vs anterior" (rising) line must render. The
  // current 3m avg (38,120,75,44 → 69.25) is higher than previous (45) → ▲.
  await expect(durCard.getByText(/▲.*vs anterior/)).toBeVisible();
});

test("capture a screenshot per range", async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  for (const range of ["3m", "6m", "12m", "Tudo"] as const) {
    await selectRange(page, range);
    // Let the chart settle (animations are disabled, so this is brief).
    await expect(
      page.getByRole("heading", { name: "Frequência de crises" })
    ).toBeVisible();
    const file = range === "Tudo" ? "tudo" : range; // 3m/6m/12m/tudo
    await page.screenshot({
      path: path.join(SHOT_DIR, `trends-${file}-${project}.png`),
      fullPage: true,
    });
  }
});
