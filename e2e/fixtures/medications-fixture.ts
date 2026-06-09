/**
 * Deterministic e2e fixture for the Medications edit/archive flow (RMP-183).
 *
 * Establishes a KNOWN medication set for the dog "Molly" that exercises the full
 * edit → archive → reactivate flow plus the vet-report correctness for a
 * discontinued med. Dates are FIXED (never Date.now()) so runs are reproducible;
 * "recent" data is anchored around 2026-06 to line up with the app's current
 * date (~2026-06-09).
 *
 * SAFETY: this is SURGICAL — it only resets the two `E2E ` meds it owns (by
 * name), never the user's real medications. Unlike the trends fixture (episodes
 * ARE its demo dataset), a dog's medication list mixes real data with test data,
 * so we must NOT blanket-delete it. We also assert DATABASE_URL points at a local
 * database before writing and THROW otherwise — never run this against a
 * remote/prod DB. The admin user, the dog Molly, and all non-E2E meds are intact.
 *
 * Idempotent: clean-then-insert the canonical set on every run.
 *
 * The two canonical meds:
 *  • "E2E Ativo" — ACTIVE, strengthMg 50, an OPEN schedule (1 un × 1 dose/day →
 *    50 mg/dose) and ample stock (status "ok"). This is the med the spec EDITS
 *    (50 → 80 mg/dose) then ARCHIVES then REACTIVATES. The archive closes its
 *    open schedule via the app's real DELETE (effectiveTo = today), so we do NOT
 *    hard-code that boundary here.
 *  • "E2E Descontinuado" — pre-ARCHIVED (isActive:false, archivedAt 2026-05-15,
 *    ~1 month ago → inside the default 6-month report window 2025-12-09..now). It
 *    has TWO schedules: an earlier one (from 2025-10-01, before the window) and an
 *    in-window dose change (from 2026-02-15, effectiveTo = the archive date
 *    2026-05-15). So it OVERLAPS the report range (wasActiveDuring) AND its
 *    2026-02-15 dose change falls inside the range → it appears under
 *    "Medicamentos atuais" with "Descontinuado em 15/05/2026" AND under
 *    "Alterações de dose no período".
 *
 * Run directly:  npx tsx e2e/fixtures/medications-fixture.ts
 * Or import { applyMedicationsFixture } from a setup/spec step.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Safety guard (mirrors trends-fixture.ts exactly) ───────────────────────────

function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes(":5433");
  if (!isLocal) {
    throw new Error(
      `Refusing to run the medications fixture: DATABASE_URL does not look ` +
        `local (expected localhost / 127.0.0.1 / :5433). Got: ${url || "<unset>"}`
    );
  }
}

// ─── Canonical dataset ─────────────────────────────────────────────────────────

/** Names chosen to be unambiguous and to never collide with the seed meds
 *  (Fenobarbital, Brometo de Potássio), so test locators bite cleanly. */
export const ACTIVE_MED_NAME = "E2E Ativo";
export const ARCHIVED_MED_NAME = "E2E Descontinuado";

/** The active med's concentration before the spec's edit (mg/dose === strengthMg
 *  because unitsPerDose === 1), and the value the spec edits it TO. */
export const ACTIVE_MED_STRENGTH_BEFORE = 50;
export const ACTIVE_MED_STRENGTH_AFTER = 80;

/** The archived med's discontinuation date (also rendered in the report). */
export const ARCHIVED_AT_ISO = "2026-05-15T12:00:00-03:00";
/** dd/mm/yyyy rendering of ARCHIVED_AT_ISO in America/Sao_Paulo. */
export const ARCHIVED_AT_DISPLAY = "15/05/2026";
/** effectiveFrom of the archived med's IN-RANGE dose change (dd/mm/yyyy). */
export const ARCHIVED_DOSE_CHANGE_DISPLAY = "15/02/2026";

// @db.Date columns: pass UTC-midnight so the day is stable regardless of host TZ.
function dbDate(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

// ─── Applier ────────────────────────────────────────────────────────────────────

export async function applyMedicationsFixture(
  client: PrismaClient = prisma
): Promise<{ dogId: string; inserted: number }> {
  assertLocalDatabase();

  const dog = await client.dog.findFirst({ where: { name: "Molly" } });
  if (!dog) {
    throw new Error(
      "Dog 'Molly' not found — run the base seed (npx prisma db seed) first."
    );
  }

  // Reset ONLY the two meds this fixture owns (matched by their E2E names) — the
  // user's real meds are left completely untouched. Delete in FK order: stock
  // transactions + schedules (children) before medications.
  const meds = await client.medication.findMany({
    where: { dogId: dog.id, name: { in: [ACTIVE_MED_NAME, ARCHIVED_MED_NAME] } },
    select: { id: true },
  });
  const medIds = meds.map((m) => m.id);
  if (medIds.length) {
    await client.stockTransaction.deleteMany({
      where: { medicationId: { in: medIds } },
    });
    await client.medicationSchedule.deleteMany({
      where: { medicationId: { in: medIds } },
    });
    await client.medication.deleteMany({ where: { id: { in: medIds } } });
  }

  // ── ACTIVE med: "E2E Ativo" ─────────────────────────────────────────────────
  // 50 mg, one open schedule (1 un × 1 dose/day → 50 mg/dose), ample stock so it
  // renders status "ok" (daysRemaining ≫ leadTime + buffer).
  const active = await client.medication.create({
    data: {
      dogId: dog.id,
      name: ACTIVE_MED_NAME,
      category: "continuous",
      form: "pill",
      strengthMg: ACTIVE_MED_STRENGTH_BEFORE,
      reorderLeadTimeDays: 7,
      isActive: true,
      archivedAt: null,
      schedules: {
        create: [
          {
            doseTimes: ["08:00"],
            unitsPerDose: 1,
            effectiveFrom: dbDate("2026-03-01"),
            effectiveTo: null, // OPEN — the app's archive DELETE closes this today
          },
        ],
      },
      stockTransactions: {
        create: [
          {
            type: "restock",
            quantity: 365, // ~1y supply @ 1 un/day → daysRemaining ≫ 7+7 → "ok"
            occurredAt: new Date("2026-06-08T10:00:00-03:00"),
          },
        ],
      },
    },
  });

  // ── ARCHIVED med: "E2E Descontinuado" ───────────────────────────────────────
  // Pre-archived; window 2025-10-01 .. 2026-05-15 overlaps the default 6-month
  // report range, and the 2026-02-15 dose change is in-range.
  const archived = await client.medication.create({
    data: {
      dogId: dog.id,
      name: ARCHIVED_MED_NAME,
      category: "continuous",
      form: "pill",
      strengthMg: 100,
      reorderLeadTimeDays: 7,
      isActive: false,
      archivedAt: new Date(ARCHIVED_AT_ISO),
      schedules: {
        create: [
          {
            // Earlier dose (before the report window) — establishes that the
            // 2026-02-15 schedule is a genuine dose CHANGE.
            doseTimes: ["08:00", "20:00"],
            unitsPerDose: 1,
            effectiveFrom: dbDate("2025-10-01"),
            effectiveTo: dbDate("2026-02-15"),
          },
          {
            // In-range dose change → appears under "Alterações de dose no período".
            // Closed at the archive date (mirrors the app's archive behaviour).
            doseTimes: ["08:00", "20:00"],
            unitsPerDose: 2,
            effectiveFrom: dbDate("2026-02-15"),
            effectiveTo: dbDate("2026-05-15"),
          },
        ],
      },
    },
  });

  return { dogId: dog.id, inserted: [active, archived].length };
}

// ─── CLI entrypoint ─────────────────────────────────────────────────────────────

// Run when executed directly (tsx e2e/fixtures/medications-fixture.ts), not on import.
if (process.argv[1] && process.argv[1].endsWith("medications-fixture.ts")) {
  applyMedicationsFixture()
    .then(({ inserted }) => {
      console.log(`Medications fixture applied: ${inserted} meds for Molly.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
