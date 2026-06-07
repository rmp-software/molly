/**
 * Date helpers for normalising Prisma @db.Date columns.
 *
 * Prisma @db.Date columns are returned as UTC-midnight Date objects
 * (e.g. 2026-06-07T00:00:00.000Z). The schedule/stock engines use local
 * getters (getFullYear / getMonth / getDate), so in any UTC-negative timezone
 * those dates read as the previous calendar day, shifting every schedule
 * boundary by one day.
 *
 * dbDateToLocalMidnight() extracts the UTC year/month/day and returns a
 * LOCAL-midnight Date so that local getters return the correct calendar day,
 * regardless of host TZ.
 */

export function dbDateToLocalMidnight(d: Date | string): Date {
  const x = typeof d === "string" ? new Date(d) : d;
  return new Date(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}

export function dbDateToLocalMidnightNullable(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  return dbDateToLocalMidnight(d);
}
