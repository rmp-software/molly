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

import { VALID_TYPES, type SeizureType } from "./seizure-types";

export interface Episode {
  occurredAt: Date;
  type: SeizureType;
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

/**
 * Like perPeriod, but splits each bucket's count by SeizureType.
 *
 * Reuses the exact same week/month binning as perPeriod (via buildBins), so
 * totals are guaranteed to match perPeriod for the same input.
 *
 *   byType — Partial<Record<SeizureType, number>>. Types with a ZERO count in a
 *            bucket are OMITTED from the record (sparse), not set to 0. A bucket
 *            with no episodes therefore has byType === {}. The type is Partial so
 *            consumers must guard for absent keys (no NaN arithmetic on undefined).
 *   total  — sum of byType (== the perPeriod count for that bucket).
 *
 * Episodes whose occurredAt falls outside [range.from, range.to) are ignored.
 */
export function perPeriodByType(
  episodes: Episode[],
  bucket: "week" | "month",
  range: { from: Date; to: Date }
): {
  label: string;
  start: Date;
  byType: Partial<Record<SeizureType, number>>;
  total: number;
}[] {
  const bins = buildBins(bucket, range);
  return bins.map((bin) => {
    const byType: Partial<Record<SeizureType, number>> = {};
    let total = 0;
    for (const e of episodes) {
      if (!inBin(bin, e.occurredAt.getTime())) continue;
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      total++;
    }
    return {
      label: bin.label,
      start: bin.start,
      byType,
      total,
    };
  });
}

/**
 * Returns the SeizureTypes that occur at least once in `episodes`, in canonical
 * order (tonic_clonic, focal, absence, other — i.e. VALID_TYPES order). Types
 * with a zero count are omitted.
 */
export function typesPresent(episodes: Episode[]): SeizureType[] {
  const seen = new Set<SeizureType>();
  for (const e of episodes) seen.add(e.type);
  return VALID_TYPES.filter((t) => seen.has(t));
}

/**
 * Per-bucket mean episode duration for a single SeizureType.
 *
 * Same week/month binning as perPeriod. Only episodes whose `type === type`
 * AND `durationSeconds != null` are considered.
 *
 *   n          — count of qualifying episodes in the bucket.
 *   avgSeconds — mean of their durations, or null when n === 0.
 *
 * Episodes outside [range.from, range.to) are ignored.
 */
export function avgDurationPerPeriod(
  episodes: Episode[],
  bucket: "week" | "month",
  range: { from: Date; to: Date },
  type: SeizureType
): { label: string; start: Date; avgSeconds: number | null; n: number }[] {
  const bins = buildBins(bucket, range);
  return bins.map((bin) => {
    let sum = 0;
    let n = 0;
    for (const e of episodes) {
      if (e.type !== type) continue;
      if (e.durationSeconds == null) continue;
      if (!inBin(bin, e.occurredAt.getTime())) continue;
      sum += e.durationSeconds;
      n++;
    }
    return {
      label: bin.label,
      start: bin.start,
      avgSeconds: n === 0 ? null : sum / n,
      n,
    };
  });
}

/**
 * Summary duration statistics for a SeizureType over the current range vs. the
 * immediately-preceding equal-length window.
 *
 *   currentAvg     — mean duration of `type` episodes with non-null duration in
 *                    [range.from, range.to); null if none.
 *   previousAvg    — same for [from-(to-from), from); null if none.
 *   deltaSeconds   — currentAvg - previousAvg; null if either side is null.
 *   direction      — sign of the least-squares slope of per-bucket avg duration
 *                    across the current range's non-null buckets, computed over
 *                    avgDurationPerPeriod(episodes, bucket, range, type):
 *                    "up" | "down" | "flat". Treated as "flat" when there are
 *                    fewer than 2 non-null buckets, or |slope| < 1 sec/bucket.
 *   emergencyCount — count of `type` episodes in the current range with
 *                    durationSeconds >= 60 (inclusive).
 *   maxSeconds     — max duration among current-range `type` episodes with a
 *                    non-null duration; null if none.
 *
 * `bucket` selects the granularity for the trend slope and MUST match the bucket
 * the caller feeds to avgDurationPerPeriod for the duration line chart, so the
 * direction hint never contradicts the rendered chart. The current/previous
 * windows themselves are derived purely from `range` and are independent of
 * `bucket`.
 */
export function durationStats(
  episodes: Episode[],
  range: { from: Date; to: Date },
  type: SeizureType,
  bucket: "week" | "month"
): {
  currentAvg: number | null;
  previousAvg: number | null;
  deltaSeconds: number | null;
  direction: "up" | "down" | "flat";
  emergencyCount: number;
  maxSeconds: number | null;
} {
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  const span = toMs - fromMs;
  const prevRange = { from: new Date(fromMs - span), to: new Date(fromMs) };

  // Qualifying = matching type with non-null duration, within a window.
  const durationsIn = (lo: number, hi: number): number[] =>
    episodes
      .filter(
        (e) =>
          e.type === type &&
          e.durationSeconds != null &&
          e.occurredAt.getTime() >= lo &&
          e.occurredAt.getTime() < hi
      )
      .map((e) => e.durationSeconds as number);

  const mean = (xs: number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, n) => a + n, 0) / xs.length;

  const current = durationsIn(fromMs, toMs);
  const previous = durationsIn(
    prevRange.from.getTime(),
    prevRange.to.getTime()
  );

  const currentAvg = mean(current);
  const previousAvg = mean(previous);
  const deltaSeconds =
    currentAvg == null || previousAvg == null ? null : currentAvg - previousAvg;

  const emergencyCount = current.filter((s) => s >= 60).length;
  const maxSeconds = current.length === 0 ? null : Math.max(...current);

  // Trend: least-squares slope of per-bucket avg over non-null buckets, using
  // the caller-supplied `bucket` so the direction matches the line chart the
  // caller renders from avgDurationPerPeriod(episodes, bucket, range, type).
  const perBucket = avgDurationPerPeriod(episodes, bucket, range, type).filter(
    (b) => b.avgSeconds != null
  );
  const direction = slopeDirection(
    perBucket.map((b, i) => ({ x: i, y: b.avgSeconds as number }))
  );

  return {
    currentAvg,
    previousAvg,
    deltaSeconds,
    direction,
    emergencyCount,
    maxSeconds,
  };
}

/**
 * Returns the earliest occurredAt among `episodes`, or null when empty.
 */
export function firstEpisodeAt(episodes: Episode[]): Date | null {
  if (episodes.length === 0) return null;
  return episodes.reduce(
    (earliest, e) =>
      e.occurredAt.getTime() < earliest.getTime() ? e.occurredAt : earliest,
    episodes[0].occurredAt
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 3600 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** Minimum |slope| (seconds per bucket) to count as a real trend. */
const FLAT_SLOPE_EPSILON = 1;

/**
 * Classifies the trend of `points` by the sign of the least-squares slope.
 * Returns "flat" for fewer than 2 points or |slope| < FLAT_SLOPE_EPSILON.
 */
function slopeDirection(
  points: { x: number; y: number }[]
): "up" | "down" | "flat" {
  const k = points.length;
  if (k < 2) return "flat";

  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);

  const denom = k * sumXX - sumX * sumX;
  if (denom === 0) return "flat";

  const slope = (k * sumXY - sumX * sumY) / denom;
  if (Math.abs(slope) < FLAT_SLOPE_EPSILON) return "flat";
  return slope > 0 ? "up" : "down";
}

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

/**
 * A single time bin spanning [lo, hi) (millisecond bounds, half-open).
 *   - start: the bin's nominal start Date (the value surfaced as `start`)
 *   - label: pre-computed display label
 *   - lo / hi: effective membership bounds (lo is clamped to range.from for the
 *     first month bin; hi is clamped to range.to for trailing partial bins)
 *
 * This is the single source of truth for week/month binning, shared by
 * perPeriod, perPeriodByType and avgDurationPerPeriod so the boundaries never
 * diverge.
 */
interface Bin {
  start: Date;
  label: string;
  lo: number;
  hi: number;
}

/** Returns true if `t` falls in the half-open bin [bin.lo, bin.hi). */
function inBin(bin: Bin, t: number): boolean {
  return t >= bin.lo && t < bin.hi;
}

/**
 * Builds the ordered list of bins for a [from, to) range.
 *   - week: 7-day bins from range.from; label = "dd/mm" of bin start.
 *   - month: calendar-month bins; label = pt-BR 3-char month. The first bin's
 *     lower bound is clamped to range.from; the last bin's upper bound to range.to.
 */
function buildBins(bucket: "week" | "month", range: { from: Date; to: Date }): Bin[] {
  if (bucket === "week") {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    const bins: Bin[] = [];
    let cursor = fromMs;
    while (cursor < toMs) {
      const start = new Date(cursor);
      const day = String(start.getDate()).padStart(2, "0");
      const month = String(start.getMonth() + 1).padStart(2, "0");
      bins.push({
        start,
        label: `${day}/${month}`,
        lo: cursor,
        hi: Math.min(cursor + MS_PER_WEEK, toMs),
      });
      cursor += MS_PER_WEEK;
    }
    return bins;
  }

  const bins: Bin[] = [];
  let year = range.from.getFullYear();
  let month = range.from.getMonth(); // 0-based
  while (true) {
    const binStart = new Date(year, month, 1);
    if (binStart.getTime() >= range.to.getTime()) break;

    const nextMonth = month + 1 > 11 ? 0 : month + 1;
    const nextYear = month + 1 > 11 ? year + 1 : year;
    const binEnd = new Date(nextYear, nextMonth, 1);
    const effectiveEnd =
      binEnd.getTime() < range.to.getTime() ? binEnd.getTime() : range.to.getTime();
    // Clamp the lower bound to range.from so episodes before range.from are
    // excluded even when they share the first bucket's calendar month.
    const effectiveStart = Math.max(binStart.getTime(), range.from.getTime());

    bins.push({
      start: binStart,
      label: PT_BR_MONTHS[month],
      lo: effectiveStart,
      hi: effectiveEnd,
    });

    month = nextMonth;
    year = nextYear;
  }
  return bins;
}

function perPeriodWeek(
  episodes: Episode[],
  range: { from: Date; to: Date }
): { label: string; start: Date; count: number }[] {
  return countBins(episodes, buildBins("week", range));
}

function perPeriodMonth(
  episodes: Episode[],
  range: { from: Date; to: Date }
): { label: string; start: Date; count: number }[] {
  return countBins(episodes, buildBins("month", range));
}

function countBins(
  episodes: Episode[],
  bins: Bin[]
): { label: string; start: Date; count: number }[] {
  return bins.map((bin) => ({
    label: bin.label,
    start: bin.start,
    count: episodes.filter((e) => inBin(bin, e.occurredAt.getTime())).length,
  }));
}
