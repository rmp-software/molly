/**
 * Stock engine — pure functions, no side effects.
 * All functions accept explicit Date arguments; never call Date.now() or new Date()
 * without explicit args.
 *
 * Stock model:
 *   currentStock = (sum of all transaction quantity deltas up to asOf)
 *                − (scheduled consumption accrued over the whole horizon [start, asOf))
 *
 * This means:
 *   - restock: positive quantity (adds to deltas)
 *   - adjustment: signed quantity (the stored delta already encodes the drift correction)
 *   - consumption (manual): negative quantity if stored directly
 *
 * Consumption is calculated automatically from schedules — it is NOT double-subtracted
 * from explicit consumption transactions.  The canonical transaction types are restock
 * and adjustment; consumption entries (if any) are summed into deltas just like adjustments.
 */

import { dailyConsumption, activeScheduleOn } from "./schedule";
import type { Schedule } from "./schedule";

export type StockTxType = "restock" | "adjustment" | "consumption";

export interface StockTx {
  type: StockTxType;
  /** Signed quantity: restock +, adjustment ±, consumption − */
  quantity: number;
  occurredAt: Date;
}

/**
 * Computes stock level at `asOf`.
 *
 * Steps:
 *   1. Filter txns to those with occurredAt <= asOf.  If none → 0.
 *   2. deltas = sum of filtered txn quantities (all types are simple signed deltas).
 *   3. start = DATE of the earliest included txn.
 *   4. consumption = Σ dailyConsumption(activeScheduleOn(schedules, day))
 *      for each calendar day in the half-open range [start, asOf).
 *      Days with no active schedule contribute 0.
 *   5. return deltas − consumption.
 *
 * Result may be negative; callers clamp for display.
 * Day arithmetic uses UTC-midnight values to avoid DST drift.
 */
export function currentStock(
  txns: StockTx[],
  schedules: Schedule[],
  asOf: Date
): number {
  const asOfKey = dateUTCKey(asOf);
  const included = txns.filter((t) => t.occurredAt.getTime() <= asOf.getTime());

  if (included.length === 0) return 0;

  const deltas = included.reduce((sum, t) => sum + t.quantity, 0);

  // Earliest transaction date
  const startTime = Math.min(...included.map((t) => t.occurredAt.getTime()));
  const startDate = new Date(startTime);
  const startKey = dateUTCKey(startDate);

  // Count whole days in [start, asOf) using UTC-midnight keys
  const totalDays = Math.round((asOfKey - startKey) / MS_PER_DAY);

  let consumption = 0;
  for (let i = 0; i < totalDays; i++) {
    const y = startDate.getFullYear();
    const m = startDate.getMonth();
    const dayDate = new Date(y, m, startDate.getDate() + i);
    const active = activeScheduleOn(schedules, dayDate);
    if (active) {
      consumption += dailyConsumption(active);
    }
  }

  return deltas - consumption;
}

/**
 * Returns the number of days of stock remaining.
 * Returns null if dailyConsumption is 0 (indefinite / no active schedule).
 * Clamps to ≥ 0 (negative stock → 0 days).
 */
export function daysRemaining(
  stock: number,
  dailyConsumptionValue: number
): number | null {
  if (dailyConsumptionValue <= 0) return null;
  return Math.max(0, Math.floor(stock / dailyConsumptionValue));
}

/**
 * Returns the date by which a reorder should be placed to avoid running out.
 *   runOut = asOf + daysRemaining days
 *   reorderBy = runOut − leadTimeDays days
 */
export function reorderByDate(
  asOf: Date,
  daysRemainingValue: number,
  leadTimeDays: number
): Date {
  const runOutMs =
    asOf.getTime() + daysRemainingValue * MS_PER_DAY;
  const reorderMs = runOutMs - leadTimeDays * MS_PER_DAY;
  const r = new Date(reorderMs);
  // Return a local-midnight date (preserve date arithmetic intent)
  return new Date(r.getFullYear(), r.getMonth(), r.getDate());
}

/**
 * Classifies stock urgency.
 *   null daysRemaining → "ok" (no consumption / indefinite supply)
 *   daysRemaining <= leadTimeDays → "urgent"
 *   daysRemaining <= leadTimeDays + bufferDays → "reorder"
 *   else → "ok"
 */
export function stockStatus(
  daysRemainingValue: number | null,
  leadTimeDays: number,
  bufferDays = 7
): "ok" | "reorder" | "urgent" {
  if (daysRemainingValue === null) return "ok";
  if (daysRemainingValue <= leadTimeDays) return "urgent";
  if (daysRemainingValue <= leadTimeDays + bufferDays) return "reorder";
  return "ok";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 3600 * 1000;

/**
 * Returns the UTC-midnight timestamp (ms) for the calendar date of d (local time).
 * Using UTC.midnight values avoids DST gaps in day-counting arithmetic.
 */
function dateUTCKey(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}
