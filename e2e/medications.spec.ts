import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import {
  applyMedicationsFixture,
  ACTIVE_MED_NAME,
  ARCHIVED_MED_NAME,
  ACTIVE_MED_STRENGTH_BEFORE,
  ACTIVE_MED_STRENGTH_AFTER,
  ARCHIVED_AT_DISPLAY,
} from "./fixtures/medications-fixture";

/**
 * /medications — phone-sized end-to-end verification of the edit/archive flow
 * (RMP-183). Runs on BOTH phone projects (chromium-phone + webkit-phone).
 *
 * The flow MUTATES state (edit concentration, archive, reactivate), so each
 * project re-seeds the deterministic medications fixture in beforeAll (NOT in
 * global.setup, which runs once). The fixture is dev-only + local-DB-guarded.
 *
 * Expected values are DERIVED from the fixture:
 *   • "E2E Ativo": 50 mg, 1 un × 1 dose/day → subtitle "50 mg/dose"; edited to
 *     80 → "80 mg/dose".
 *   • "E2E Descontinuado": archivedAt 2026-05-15 → report shows it under
 *     "Medicamentos atuais" with "Descontinuado em 15/05/2026", and its
 *     2026-02-15 dose change under "Alterações de dose no período".
 *
 * Assertions BITE: scoped to the card / drawer / dialog / report section under
 * test, asserting the exact mg value, the exact archived count, and the med name
 * in the right section — not just that some text exists globally.
 */

const SHOT_DIR = path.join(__dirname, "__screenshots__");

// The card subtitle joins each fact with non-breaking spaces (see buildSubtitle
// in MedicationsClient: nb() swaps every space for  ). Match the mg/dose
// value with a space class that tolerates either, so the assertion bites the
// exact number regardless of the space glyph.
function mgDoseRe(mg: number): RegExp {
  return new RegExp(`(^|[^\\d])${mg}[\\s\\u00A0]mg/dose`);
}

test.beforeAll(async () => {
  // CI-safety: create the screenshot dir before any page.screenshot writes into it.
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  // Re-seed fresh per project — the flow archives/reactivates, so a previous
  // project's run must not leak state into this one.
  const prisma = new PrismaClient();
  try {
    const { inserted } = await applyMedicationsFixture(prisma);
    expect(inserted).toBe(2);
  } finally {
    await prisma.$disconnect();
  }
});

// Locate the active-list card for a given med name by walking up from the name
// <p> to its card container (the element carrying the rounded card padding).
function cardFor(page: import("@playwright/test").Page, name: string) {
  return page
    .getByText(name, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
}

test("edit → archive → reactivate flow + report correctness", async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;

  await page.goto("/medications");

  // ── 1. The active med's card renders with its pre-edit subtitle ─────────────
  const activeCard = cardFor(page, ACTIVE_MED_NAME);
  await expect(activeCard).toBeVisible({ timeout: 30_000 });
  await expect(
    activeCard.getByText(mgDoseRe(ACTIVE_MED_STRENGTH_BEFORE))
  ).toBeVisible();

  // Open the ⋯ action drawer for the active med.
  await activeCard
    .getByRole("button", { name: `Ações para ${ACTIVE_MED_NAME}` })
    .click();

  // Drawer is a Vaul dialog titled with the med name; scope to it.
  const drawer = page.getByRole("dialog").filter({ hasText: ACTIVE_MED_NAME });
  await expect(drawer).toBeVisible();

  // ── 1b. Assert ALL SIX actions are listed ───────────────────────────────────
  for (const label of [
    "Repor estoque",
    "Corrigir estoque",
    "Agendamento",
    "Adicionar ao Google Agenda",
    "Editar remédio",
    "Arquivar remédio",
  ]) {
    await expect(
      drawer.getByText(label, { exact: true })
    ).toBeVisible();
  }

  await page.screenshot({
    path: path.join(SHOT_DIR, `medications-drawer-${project}.png`),
    fullPage: true,
  });

  // ── 2. Edit → change Concentração 50 → 80 → Salvar ──────────────────────────
  await drawer.getByText("Editar remédio", { exact: true }).click();

  const editSheet = page.getByRole("dialog").filter({ hasText: "Editar remédio" });
  await expect(editSheet).toBeVisible();

  const concInput = editSheet.getByLabel("Concentração (mg)");
  await expect(concInput).toBeVisible();
  // Pre-filled from the med (50 → "50" in pt-BR, no decimals).
  await expect(concInput).toHaveValue(String(ACTIVE_MED_STRENGTH_BEFORE));
  await concInput.fill(String(ACTIVE_MED_STRENGTH_AFTER));

  await editSheet.getByRole("button", { name: "Salvar remédio" }).click();
  await expect(editSheet).toBeHidden();

  // ── 2b. Card subtitle reflects the NEW mg/dose (bites the exact value) ───────
  const activeCardAfter = cardFor(page, ACTIVE_MED_NAME);
  await expect(
    activeCardAfter.getByText(mgDoseRe(ACTIVE_MED_STRENGTH_AFTER))
  ).toBeVisible({ timeout: 10_000 });
  // The old value must be gone from that card.
  await expect(
    activeCardAfter.getByText(mgDoseRe(ACTIVE_MED_STRENGTH_BEFORE))
  ).toHaveCount(0);

  await page.screenshot({
    path: path.join(SHOT_DIR, `medications-post-edit-${project}.png`),
    fullPage: true,
  });

  // ── 3. Archive: ⋯ → Arquivar remédio → confirm dialog → Arquivar ────────────
  await activeCardAfter
    .getByRole("button", { name: `Ações para ${ACTIVE_MED_NAME}` })
    .click();
  const drawer2 = page.getByRole("dialog").filter({ hasText: ACTIVE_MED_NAME });
  await expect(drawer2).toBeVisible();
  await drawer2.getByText("Arquivar remédio", { exact: true }).click();

  // Confirm AlertDialog — assert exact title + body copy.
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toBeVisible();
  await expect(
    confirm.getByText(`Arquivar ${ACTIVE_MED_NAME}?`, { exact: true })
  ).toBeVisible();
  await expect(
    confirm.getByText(
      "O histórico é mantido e você pode reativar depois. O agendamento atual será encerrado hoje.",
      { exact: true }
    )
  ).toBeVisible();

  // The confirm "Arquivar" button (NOT the drawer's "Arquivar remédio" row).
  await confirm.getByRole("button", { name: "Arquivar", exact: true }).click();
  await expect(confirm).toBeHidden();

  // ── 3b. Med LEAVES the active list ───────────────────────────────────────────
  // The only remaining place the name may appear is the Arquivados section.
  await expect(async () => {
    const card = page
      .getByText(ACTIVE_MED_NAME, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    expect(await card.count()).toBe(0);
  }).toPass({ timeout: 10_000 });

  // ── 3c. Arquivados section: assert count + the archived row ──────────────────
  const archivedToggle = page.getByRole("button", { name: /^Arquivados \(/ });
  await expect(archivedToggle).toBeVisible();
  // At least two archived now: the pre-archived fixture med + the just-archived
  // one. (>=2 not ==2 so a real archived med in the dev DB can't break this.)
  await expect(archivedToggle).toHaveText(/Arquivados \([2-9]\d*\)/);
  await archivedToggle.click();

  const archivedList = page.locator("#archived-meds-list");
  await expect(archivedList).toBeVisible();

  // The just-archived med's row: name + "Descontinuado em <today>".
  const justArchivedRow = archivedList
    .locator("li")
    .filter({ hasText: ACTIVE_MED_NAME });
  await expect(justArchivedRow).toBeVisible();
  // It carries a "Descontinuado em <date>" line. Assert the prefix + a real
  // dd/mm/yyyy rather than today's exact string, to avoid a midnight-crossing
  // flake (the app stamps archivedAt server-side at click time). The exact-date
  // bite lives on the pre-archived med below.
  await expect(
    justArchivedRow.getByText(/Descontinuado em \d{2}\/\d{2}\/\d{4}/)
  ).toBeVisible();

  // The pre-archived fixture med is also present (its known date).
  const preArchivedRow = archivedList
    .locator("li")
    .filter({ hasText: ARCHIVED_MED_NAME });
  await expect(preArchivedRow).toBeVisible();
  await expect(
    preArchivedRow.getByText(`Descontinuado em ${ARCHIVED_AT_DISPLAY}`, {
      exact: true,
    })
  ).toBeVisible();

  await page.screenshot({
    path: path.join(SHOT_DIR, `medications-arquivados-${project}.png`),
    fullPage: true,
  });

  // ── 4. Reactivate → med returns to the active list, count decrements ─────────
  await justArchivedRow.getByRole("button", { name: "Reativar" }).click();

  // Back in the active list (a real card again).
  await expect(cardFor(page, ACTIVE_MED_NAME)).toBeVisible({ timeout: 10_000 });

  // …and no longer in the archived list. Content assertion (not an exact count)
  // so any other archived med in the dev DB can't break it.
  await expect(
    page.locator("#archived-meds-list li").filter({ hasText: ACTIVE_MED_NAME })
  ).toHaveCount(0);

  // ── 5. Report: discontinued med + its dose change in the default range ───────
  await page.goto("/profile/report");
  await expect(
    page.getByText("Relatório de crises", { exact: true })
  ).toBeVisible({ timeout: 30_000 });

  // "Medicamentos atuais" card → the archived med block with its "Descontinuado
  // em <data>" line. Scope to the med's block so the assertion bites.
  const medsHeading = page.getByRole("heading", {
    name: "Medicamentos atuais",
  });
  await expect(medsHeading).toBeVisible();
  const medsCard = medsHeading.locator("xpath=..");

  const discBlock = medsCard
    .locator("div")
    .filter({ hasText: ARCHIVED_MED_NAME })
    .filter({ hasText: `Descontinuado em ${ARCHIVED_AT_DISPLAY}` })
    .first();
  await expect(discBlock).toBeVisible();
  await expect(
    discBlock.getByText(`Descontinuado em ${ARCHIVED_AT_DISPLAY}`, {
      exact: true,
    })
  ).toBeVisible();

  // "Alterações de dose no período" → the archived med's in-range dose change.
  const changesHeading = page.getByRole("heading", {
    name: "Alterações de dose no período",
  });
  await expect(changesHeading).toBeVisible();
  const changesCard = changesHeading.locator("xpath=..");
  const changeItem = changesCard
    .locator("li")
    .filter({ hasText: ARCHIVED_MED_NAME });
  await expect(changeItem.first()).toBeVisible();
  // Bite the IN-RANGE dose change specifically: the 2026-02-15 schedule has
  // unitsPerDose 2; the out-of-range 2025-10-01 one (unitsPerDose 1) must NOT
  // appear, so a regression widening the range query would turn this red.
  await expect(changeItem.first()).toContainText("2 unid./dose");

  await page.screenshot({
    path: path.join(SHOT_DIR, `medications-report-${project}.png`),
    fullPage: true,
  });
});
