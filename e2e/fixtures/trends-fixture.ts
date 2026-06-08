/**
 * Deterministic e2e fixture for the Trends + Report surfaces.
 *
 * Establishes a KNOWN seizure-episode dataset for the dog "Molly" that exercises
 * every state the trends/report charts must render. Dates are FIXED (never
 * Date.now()) so runs are reproducible; "recent" data is anchored around
 * 2026-06 to line up with the app's current date (2026-06-08).
 *
 * SAFETY: this RESETS seizure-episode rows, so it is dev-only. We assert that
 * DATABASE_URL points at a local database before deleting/inserting and THROW
 * otherwise — never run this against a remote/prod DB. The admin user and the
 * dog Molly are left intact; only `seizureEpisode` rows for Molly are reset.
 *
 * Idempotent: clean-then-insert the canonical set on every run.
 *
 * Run directly:  npx tsx e2e/fixtures/trends-fixture.ts
 * Or import { applyTrendsFixture } from a setup step.
 */

import { PrismaClient, type SeizureType, type Severity } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Safety guard ──────────────────────────────────────────────────────────────

function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes(":5433");
  if (!isLocal) {
    throw new Error(
      `Refusing to run the trends fixture: DATABASE_URL does not look local ` +
        `(expected localhost / 127.0.0.1 / :5433). Got: ${url || "<unset>"}`
    );
  }
}

// ─── Canonical dataset ─────────────────────────────────────────────────────────

interface FixtureEpisode {
  occurredAt: string; // ISO with -03:00 (America/Sao_Paulo) for determinism
  type: SeizureType;
  durationSeconds: number | null;
  severity: Severity | null;
  isCluster?: boolean;
  rescueGiven?: boolean;
  notes?: string | null;
}

/**
 * The canonical episode set. Reference date for "recent" data: 2026-06-08.
 *
 * Window boundaries the app derives from `now = 2026-06-08`:
 *   3m  → from 2026-03-08   6m → from 2025-12-08
 *   12m → from 2025-06-08   Tudo → from firstEpisode (2024-01-05)
 *
 * What each part of the set covers:
 *  • 2024-01-05  — near EPISODE_HISTORY_START so "Tudo" floors at 2024, not 2000.
 *  • 2024-xx     — includes the ONLY `other` episode → present-types-only:
 *                  "Outra" is ABSENT in 3m/6m/12m but PRESENT in Tudo.
 *  • 2025-09     — tonic_clonic durations in the 12m PREVIOUS window so the
 *                  12m delta "vs anterior" is non-null.
 *  • 2025-12 / 2026-01 — tonic_clonic durations in the 3m/6m PREVIOUS window so
 *                  those deltas are non-null too.
 *  • 2026-03..06 — multiple types in one period (tonic_clonic, focal, absence)
 *                  → stacked bars + legend; tonic_clonic durations BOTH under and
 *                  ≥60s → threshold line, danger dots, emergencyCount > 0.
 *  • 2026-05     — intentionally LEFT EMPTY (no episodes) → a month with a line
 *                  gap / empty bucket between Apr and Jun.
 */
export const FIXTURE_EPISODES: FixtureEpisode[] = [
  // ── Floor anchor (Tudo) + the only "other" type (pre-2025) ─────────────────
  {
    occurredAt: "2024-01-05T09:30:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 95,
    severity: "severe",
    rescueGiven: true,
    notes: "Primeira crise registrada (âncora do histórico).",
  },
  {
    occurredAt: "2024-03-18T22:10:00-03:00",
    type: "other",
    durationSeconds: null,
    severity: "mild",
    notes: "Evento atípico — único do tipo Outra.",
  },
  {
    occurredAt: "2024-07-22T14:00:00-03:00",
    type: "focal",
    durationSeconds: 40,
    severity: "moderate",
  },

  // ── 12m previous window (before 2025-06-08): non-null tonic_clonic durations ─
  {
    occurredAt: "2025-09-12T07:45:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 50,
    severity: "moderate",
  },
  {
    occurredAt: "2025-10-30T03:20:00-03:00",
    type: "focal",
    durationSeconds: 35,
    severity: "mild",
  },

  // ── 3m/6m previous window (2025-12-08 .. 2026-03-08): tonic_clonic durations ─
  {
    occurredAt: "2025-12-20T11:00:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 42,
    severity: "moderate",
  },
  {
    occurredAt: "2026-01-15T18:30:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 48,
    severity: "moderate",
    isCluster: true,
  },
  {
    occurredAt: "2026-02-10T06:05:00-03:00",
    type: "absence",
    durationSeconds: 15,
    severity: "mild",
  },

  // ── Current 3m window (2026-03-08 .. now): MULTIPLE types in one period ─────
  // March: tonic_clonic (under threshold) + focal + absence
  {
    occurredAt: "2026-03-14T10:15:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 38,
    severity: "moderate",
  },
  {
    occurredAt: "2026-03-22T16:40:00-03:00",
    type: "focal",
    durationSeconds: 30,
    severity: "mild",
  },
  {
    occurredAt: "2026-03-28T21:00:00-03:00",
    type: "absence",
    durationSeconds: 12,
    severity: "mild",
  },
  // April: tonic_clonic ABOVE threshold (emergency) → danger dot + count
  {
    occurredAt: "2026-04-09T02:30:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 120,
    severity: "severe",
    rescueGiven: true,
    isCluster: true,
    notes: "Crise prolongada — resgate aplicado.",
  },
  {
    occurredAt: "2026-04-18T13:50:00-03:00",
    type: "focal",
    durationSeconds: 28,
    severity: "mild",
  },
  // May: intentionally EMPTY (no episodes) → empty bucket / line gap.
  // June: tonic_clonic ABOVE threshold again + a sub-threshold one.
  {
    occurredAt: "2026-06-02T08:00:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 75,
    severity: "severe",
    rescueGiven: true,
    notes: "Emergência — acima de 1 min.",
  },
  {
    occurredAt: "2026-06-05T19:25:00-03:00",
    type: "tonic_clonic",
    durationSeconds: 44,
    severity: "moderate",
  },
];

// ─── Applier ────────────────────────────────────────────────────────────────────

export async function applyTrendsFixture(
  client: PrismaClient = prisma
): Promise<{ dogId: string; inserted: number }> {
  assertLocalDatabase();

  const dog = await client.dog.findFirst({ where: { name: "Molly" } });
  if (!dog) {
    throw new Error(
      "Dog 'Molly' not found — run the base seed (npx prisma db seed) first."
    );
  }

  // Reset ONLY this dog's seizure episodes (keep user + dog intact).
  await client.seizureEpisode.deleteMany({ where: { dogId: dog.id } });

  await client.seizureEpisode.createMany({
    data: FIXTURE_EPISODES.map((e) => ({
      dogId: dog.id,
      occurredAt: new Date(e.occurredAt),
      type: e.type,
      durationSeconds: e.durationSeconds,
      severity: e.severity,
      isCluster: e.isCluster ?? false,
      rescueGiven: e.rescueGiven ?? false,
      notes: e.notes ?? null,
    })),
  });

  return { dogId: dog.id, inserted: FIXTURE_EPISODES.length };
}

// ─── CLI entrypoint ─────────────────────────────────────────────────────────────

// Run when executed directly (tsx e2e/fixtures/trends-fixture.ts), not on import.
if (process.argv[1] && process.argv[1].endsWith("trends-fixture.ts")) {
  applyTrendsFixture()
    .then(({ inserted }) => {
      console.log(`Trends fixture applied: ${inserted} episodes for Molly.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
