/**
 * Stats engine — pure functions, no side effects.
 * All functions accept explicit Date arguments; never call Date.now() or new Date()
 * without explicit args.
 *
 * Design choices documented inline:
 *   - markCluster: bidirectional ≤24h window (see below)
 *   - breakdown: null severity bucketed as "unknown"
 *   - perPeriod/week: 7-day bins from range.from (not ISO calendar weeks)
 *   - perPeriod/month: calendar months; labels in pt-BR short form
 */

export interface Episode {
  occurredAt: Date;
  type: "tonic_clonic" | "focal" | "absence" | "other";
  severity?: "mild" | "moderate" | "severe" | null;
  durationSeconds?: number | null;
}

/**
 * Returns true if any date in `others` is within 24 hours (either direction)
 * of `candidate`.
 *
 * The ≤24h-either-side choice:
 *   Cluster detection is bidirectional — a seizure 20h *before* and one 20h
 *   *after* the candidate both indicate the same cluster event.  Using an
 *   absolute-difference check (|other - candidate| <= 24h) captures both
 *   without privileging direction, which is appropriate for retrospective
 *   analysis where insertion order is not necessarily temporal.
 */
export function markCluster(candidate: Date, others: Date[]): boolean {
  const WINDOW_MS = 24 * 3600 * 1000;
  return others.some(
    (other) => Math.abs(other.getTime() - candidate.getTime()) <= WINDOW_MS
  );
}

/**
 * Returns the time elapsed since the most recent episode whose occurredAt <= now.
 * Returns null if no such episode exists.
 * days = Math.floor(ms / 86400000).
 */
export function timeSinceLast(
  episodes: Episode[],
  now: Date
): { ms: number; days: number } | null {
  const past = episodes.filter((e) => e.occurredAt.getTime() <= now.getTime());
  if (past.length === 0) return null;

  const latest = past.reduce((best, e) =>
    e.occurredAt.getTime() > best.occurredAt.getTime() ? e : best
  );

  const ms = now.getTime() - latest.occurredAt.getTime();
  return { ms, days: Math.floor(ms / 86_400_000) };
}

/**
 * Returns the longest gap (in whole days) between consecutive episodes.
 * Sorts episodes by occurredAt first.
 * Returns null if fewer than 2 episodes.
 */
export function longestGapDays(episodes: Episode[]): number | null {
  if (episodes.length < 2) return null;

  const sorted = [...episodes].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()
  );

  let max = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gapMs =
      sorted[i].occurredAt.getTime() - sorted[i - 1].occurredAt.getTime();
    const gapDays = Math.floor(gapMs / 86_400_000);
    if (gapDays > max) max = gapDays;
  }

  return max;
}

/**
 * Aggregates episodes into three views:
 *   byType     — count per episode type
 *   bySeverity — count per severity level; null severity → "unknown"
 *   byHour     — length-24 array; index = getHours() of occurredAt
 */
export function breakdown(episodes: Episode[]): {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byHour: number[];
} {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byHour: number[] = Array.from({ length: 24 }, () => 0);

  for (const e of episodes) {
    // type
    byType[e.type] = (byType[e.type] ?? 0) + 1;

    // severity — null/undefined → "unknown"
    const sev = e.severity ?? "unknown";
    bySeverity[sev] = (bySeverity[sev] ?? 0) + 1;

    // hour
    byHour[e.occurredAt.getHours()]++;
  }

  return { byType, bySeverity, byHour };
}

/**
 * Buckets episodes across a [from, to) range.
 *
 * week mode:
 *   7-day bins starting from `range.from`. Labels = "dd/mm" of bin start.
 *   Rationale: simple 7-day bins from `from` are deterministic and
 *   timezone-agnostic, avoiding ISO-week boundary edge cases.
 *   The last bin may be a partial week if (to - from) is not a multiple of 7.
 *
 * month mode:
 *   Calendar-month bins. Label = pt-BR short month name (3-char lowercase).
 *   A bin starts on the 1st of each month; episode is included if
 *   binStart <= occurredAt < next binStart.
 *
 * Episodes whose occurredAt falls outside [from, to) are ignored.
 */
export function perPeriod(
  episodes: Episode[],
  bucket: "week" | "month",
  range: { from: Date; to: Date }
): { label: string; start: Date; count: number }[] {
  if (bucket === "week") {
    return perPeriodWeek(episodes, range);
  }
  return perPeriodMonth(episodes, range);
}

/**
 * Total episodes in [from, to) divided by number of calendar months spanned.
 * Number of months = (to.year - from.year) * 12 + (to.month - from.month).
 * Episodes on `to` (exact) are excluded (half-open range).
 */
export function monthlyAverage(
  episodes: Episode[],
  range: { from: Date; to: Date }
): number {
  const fromTime = range.from.getTime();
  const toTime = range.to.getTime();
  const inRange = episodes.filter(
    (e) => e.occurredAt.getTime() >= fromTime && e.occurredAt.getTime() < toTime
  );

  const months =
    (range.to.getFullYear() - range.from.getFullYear()) * 12 +
    (range.to.getMonth() - range.from.getMonth());

  if (months <= 0) return inRange.length;
  return inRange.length / months;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 3600 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** pt-BR short month names (0-indexed) */
const PT_BR_MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function perPeriodWeek(
  episodes: Episode[],
  range: { from: Date; to: Date }
): { label: string; start: Date; count: number }[] {
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();

  // Build bin start times: from, from+7d, from+14d, ... until >= to
  const bins: { start: Date; end: Date }[] = [];
  let cursor = fromMs;
  while (cursor < toMs) {
    const binStart = new Date(cursor);
    const binEnd = new Date(Math.min(cursor + MS_PER_WEEK, toMs));
    bins.push({ start: binStart, end: binEnd });
    cursor += MS_PER_WEEK;
  }

  return bins.map(({ start, end }) => {
    const count = episodes.filter((e) => {
      const t = e.occurredAt.getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;

    const day = String(start.getDate()).padStart(2, "0");
    const month = String(start.getMonth() + 1).padStart(2, "0");
    const label = `${day}/${month}`;

    return { label, start, count };
  });
}

function perPeriodMonth(
  episodes: Episode[],
  range: { from: Date; to: Date }
): { label: string; start: Date; count: number }[] {
  const results: { label: string; start: Date; count: number }[] = [];

  let year = range.from.getFullYear();
  let month = range.from.getMonth(); // 0-based

  while (true) {
    const binStart = new Date(year, month, 1);
    if (binStart.getTime() >= range.to.getTime()) break;

    const nextMonth = month + 1 > 11 ? 0 : month + 1;
    const nextYear = month + 1 > 11 ? year + 1 : year;
    const binEnd = new Date(nextYear, nextMonth, 1);
    const effectiveEnd =
      binEnd.getTime() < range.to.getTime() ? binEnd : range.to;

    // Clamp the lower bound to range.from so that episodes before range.from
    // are excluded even when they fall in the same calendar month as the first bucket.
    const effectiveStart = Math.max(binStart.getTime(), range.from.getTime());
    const count = episodes.filter((e) => {
      const t = e.occurredAt.getTime();
      return t >= effectiveStart && t < effectiveEnd.getTime();
    }).length;

    const label = PT_BR_MONTHS[month];

    results.push({ label, start: binStart, count });

    month = nextMonth;
    year = nextYear;
  }

  return results;
}
