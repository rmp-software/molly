/**
 * Medication activity-window helpers — pure functions, no side effects / no IO.
 * All functions take explicit Date arguments; never call Date.now() or new Date()
 * without explicit args.
 */

export interface MedActivityWindow {
  createdAt: Date;
  archivedAt: Date | null; // discontinuation timestamp; null if never archived
  isActive: boolean; // false once archived
  schedules: { effectiveFrom: Date; effectiveTo: Date | null }[];
}

/**
 * True if the med's active window overlaps the inclusive range [from, to].
 *
 * windowStart = earliest schedules[].effectiveFrom if any schedules exist,
 *               else med.createdAt.
 * windowEnd   = null (open-ended) if med.isActive,
 *               else med.archivedAt if set,
 *               else the latest schedules[].effectiveTo (max) if any,
 *               else med.createdAt.
 *
 * Overlap (inclusive): windowStart <= to && (windowEnd === null || windowEnd >= from).
 * All comparisons use .getTime() (compare by timestamp, not reference).
 *
 * Contract notes for callers:
 * - `isActive` wins: a med with isActive=true is treated as ongoing (windowEnd=null)
 *   and `archivedAt` is ignored. Reactivate clears archivedAt atomically (see RMP-177),
 *   so isActive=true && archivedAt!=null should never occur; if it somehow does, the
 *   med is treated as active.
 * - Date normalization is the caller's responsibility. `archivedAt` is a timestamptz
 *   (full instant) while schedule effectiveFrom/effectiveTo are @db.Date (UTC-midnight).
 *   Pass instants that are comparable to your `from`/`to` bounds — the report route
 *   normalizes @db.Date via dbDateToLocalMidnight; do the same with archivedAt's day
 *   if mixing the two against a date-only range.
 * - Callers must ensure from <= to (report ranges are always ordered).
 */
export function wasActiveDuring(
  med: MedActivityWindow,
  from: Date,
  to: Date
): boolean {
  const windowStart = med.schedules.length
    ? Math.min(...med.schedules.map((s) => s.effectiveFrom.getTime()))
    : med.createdAt.getTime();

  let windowEnd: number | null;
  if (med.isActive) {
    windowEnd = null; // open-ended / still ongoing
  } else if (med.archivedAt !== null) {
    windowEnd = med.archivedAt.getTime();
  } else {
    const closedEnds = med.schedules
      .map((s) => s.effectiveTo)
      .filter((t): t is Date => t !== null)
      .map((t) => t.getTime());
    windowEnd = closedEnds.length
      ? Math.max(...closedEnds)
      : med.createdAt.getTime();
  }

  return (
    windowStart <= to.getTime() &&
    (windowEnd === null || windowEnd >= from.getTime())
  );
}
