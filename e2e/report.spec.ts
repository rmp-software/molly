import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

/**
 * /profile/report — phone-sized verification of the tonic-clonic duration block.
 *
 * The report defaults to the last 6 months (server uses real `now`; the run
 * clock is 2026-06-08, so the window is ~2025-12-08 .. 2026-06-08), where the
 * fixture has tonic_clonic durations both under and ≥60s.
 *
 * Expected value DERIVED from FIXTURE_EPISODES (e2e/fixtures/trends-fixture.ts):
 *   tonic_clonic episodes with durationSeconds>=60 in [now-6mo, now] are
 *   2026-04-09 @120s and 2026-06-02 @75s → "Acima de 1 min" = 2.
 *   (The 2024-01-05 @95s tonic_clonic is far outside the 6m window.)
 * Asserting that exact value AND its danger styling means a regression that
 * zeroes the count (e.g. the >=60 filter breaking) turns this test RED.
 */

const SHOT_DIR = path.join(__dirname, "__screenshots__");
const EXPECTED_ABOVE_1MIN = "2";

test.beforeAll(() => {
  // CI-safety: create the screenshot dir before any page.screenshot writes into
  // it (a fresh clone/CI checkout won't have e2e/__screenshots__/).
  fs.mkdirSync(SHOT_DIR, { recursive: true });
});

test("duration block shows Média, Máxima and the danger-styled above-1-min count", async ({
  page,
}, testInfo) => {
  await page.goto("/profile/report");

  // Report auto-fetches on mount; wait for the rendered content. The
  // "Relatório de crises" title is a styled <p>, not a heading.
  await expect(
    page.getByText("Relatório de crises", { exact: true })
  ).toBeVisible({ timeout: 30_000 });

  // The tonic-clonic duration block heading appears in the Resumo card.
  await expect(
    page.getByText("Duração das crises tônico-clônicas").first()
  ).toBeVisible();

  // The three labelled metrics.
  await expect(page.getByText("Média", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Máxima", { exact: true }).first()).toBeVisible();

  // Scope to the "Acima de 1 min" metric tile (label <p> + value <p>). Walk up
  // to the DurationItem container, then assert the value cell shows the exact
  // expected count AND carries the danger color class.
  const aboveLabel = page
    .getByText("Acima de 1 min", { exact: true })
    .first();
  await expect(aboveLabel).toBeVisible();
  const aboveTile = aboveLabel.locator("xpath=..");
  const aboveValue = aboveTile.locator("p").last();

  // Exact value — must FAIL if the count regresses to 0 or anything but 2.
  await expect(aboveValue).toHaveText(EXPECTED_ABOVE_1MIN);
  // Danger-styled (emergencyCount > 0 → text-danger on the value element).
  await expect(aboveValue).toHaveClass(/text-danger/);

  const project = testInfo.project.name;
  await page.screenshot({
    path: path.join(SHOT_DIR, `report-${project}.png`),
    fullPage: true,
  });
});
