/**
 * Shared trends aggregation — the single source of truth for the trends payload.
 *
 * `buildTrendsPayload` is a PURE function over already-fetched rows: Prisma stays
 * OUT of this module. Callers (the server page and the stats API route) fetch the
 * episodes, medication schedules and recent rows, then pass them in. This removes
 * the duplicated aggregation block that previously lived in both callers.
 */

import {
  perPeriod,
  perPeriodByType,
  avgDurationPerPeriod,
  durationStats,
  typesPresent,
  firstEpisodeAt,
  timeSinceLast,
  longestGapDays,
  breakdown,
  monthlyAverage,
  type Episode,
} from "./stats";
import { type SeizureType } from "./seizure-types";

// ─── Caller-provided, already-fetched inputs ──────────────────────────────────

/**
 * A medication schedule row reduced to what `medChanges` needs.
 *
 * `unitsPerDose` is typed loosely (Prisma surfaces it as a `Decimal`, which is
 * truthy-checked and string-interpolated here exactly as before) so callers can
 * pass Prisma rows directly without mapping.
 */
export interface MedScheduleLite {
  effectiveFrom: Date | string;
  unitsPerDose: { toString(): string } | number | null;
  medication: { name: string };
}

/** A serialized recent episode (output of `serializeEpisode`). */
export interface SerializedEpisode {
  id: string;
  occurredAt: string;
  type: SeizureType;
  durationSeconds: number | null;
  severity: "mild" | "moderate" | "severe" | null;
  isCluster: boolean;
  rescueGiven: boolean;
  notes: string | null;
}

export interface BuildTrendsPayloadOptions {
  from: Date;
  to: Date;
  bucket: "week" | "month";
  now: Date;
  medSchedules: MedScheduleLite[];
  recent: SerializedEpisode[];
}

// ─── Payload shape — single source of truth ───────────────────────────────────

export interface TrendsStats {
  monthlyAverage: number;
  longestGapDays: number | null;
  totalInRange: number;
  totalInYear: number;
  timeSinceLast: { days: number } | null;
}

export interface TrendsSeriesPoint {
  label: string;
  start: string;
  count: number;
}

export interface TrendsTypeSeriesPoint {
  label: string;
  start: string;
  byType: Partial<Record<SeizureType, number>>;
  total: number;
}

export interface TrendsDurationSeriesPoint {
  label: string;
  start: string;
  avgSeconds: number | null;
  n: number;
}

export interface TrendsDurationStats {
  currentAvg: number | null;
  previousAvg: number | null;
  deltaSeconds: number | null;
  direction: "up" | "down" | "flat";
  emergencyCount: number;
  maxSeconds: number | null;
}

export interface TrendsBreakdown {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byHour: number[];
}

export interface TrendsMedChange {
  date: string;
  label: string;
  bucketIndex: number;
}

export interface TrendsPayload {
  range: { from: string; to: string };
  bucket: "week" | "month";
  series: TrendsSeriesPoint[];
  stats: TrendsStats;
  breakdown: TrendsBreakdown;
  medChanges: TrendsMedChange[];
  recent: SerializedEpisode[];
  // New aggregates (RMP-169)
  typeSeries: TrendsTypeSeriesPoint[];
  typesPresent: SeizureType[];
  durationSeries: TrendsDurationSeriesPoint[];
  durationStats: TrendsDurationStats;
  firstEpisodeAt: string | null;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Builds the full trends payload from already-fetched rows.
 *
 * `allEpisodes` are all of the dog's episodes (ascending), used for the
 * range-independent stats (longestGap / timeSinceLast / totalInYear /
 * firstEpisodeAt). The range-scoped aggregates use the subset within
 * [from, to).
 */
export function buildTrendsPayload(
  allEpisodes: Episode[],
  opts: BuildTrendsPayloadOptions
): TrendsPayload {
  const { from, to, bucket, now, medSchedules, recent } = opts;
  const range = { from, to };

  // Episodes within the requested range
  const rangeEpisodes = allEpisodes.filter(
    (e) => e.occurredAt >= from && e.occurredAt < to
  );

  // Build series (seriesRaw reused below for annotation bucket indices)
  const seriesRaw = perPeriod(rangeEpisodes, bucket, range);
  const series = seriesRaw.map((s) => ({
    label: s.label,
    start: s.start.toISOString(),
    count: s.count,
  }));

  // Stats
  const mAvg = monthlyAverage(rangeEpisodes, range);
  const gapDays = longestGapDays(allEpisodes);
  const tsl = timeSinceLast(allEpisodes, now);

  // Total in current calendar year
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const totalInYear = allEpisodes.filter(
    (e) => e.occurredAt >= yearStart && e.occurredAt < yearEnd
  ).length;

  const stats: TrendsStats = {
    monthlyAverage: mAvg,
    longestGapDays: gapDays,
    totalInRange: rangeEpisodes.length,
    totalInYear,
    timeSinceLast: tsl ? { days: tsl.days } : null,
  };

  // Breakdown for the range
  const bdResult = breakdown(rangeEpisodes);

  // Med changes annotations — bucket indices from seriesRaw
  const medChanges = medSchedules.map((sched) => {
    const changeDate =
      sched.effectiveFrom instanceof Date
        ? sched.effectiveFrom
        : new Date(sched.effectiveFrom);

    // Find which bucket this date falls into
    let bucketIndex = -1;
    for (let i = 0; i < seriesRaw.length; i++) {
      const bucketStart = seriesRaw[i].start;
      const bucketEnd = i + 1 < seriesRaw.length ? seriesRaw[i + 1].start : to;
      if (changeDate >= bucketStart && changeDate < bucketEnd) {
        bucketIndex = i;
        break;
      }
    }

    const unitsStr = sched.unitsPerDose ? ` ${sched.unitsPerDose}×` : "";
    return {
      date: changeDate.toISOString(),
      label: `${sched.medication.name}${unitsStr}`,
      bucketIndex,
    };
  });

  // New aggregates (RMP-169)
  const typeSeries = perPeriodByType(rangeEpisodes, bucket, range).map((p) => ({
    label: p.label,
    start: p.start.toISOString(),
    byType: p.byType,
    total: p.total,
  }));

  const durationSeries = avgDurationPerPeriod(
    rangeEpisodes,
    bucket,
    range,
    "tonic_clonic"
  ).map((p) => ({
    label: p.label,
    start: p.start.toISOString(),
    avgSeconds: p.avgSeconds,
    n: p.n,
  }));

  // durationStats computes BOTH the current window [from,to) AND the previous
  // equal-length window [from-(to-from), from) by filtering internally, so it
  // must receive the FULL unfiltered set — passing rangeEpisodes would make the
  // previous window always empty (RMP-172).
  const durStats = durationStats(
    allEpisodes,
    range,
    "tonic_clonic",
    bucket
  );

  const firstAt = firstEpisodeAt(allEpisodes);

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    bucket,
    series,
    stats,
    breakdown: bdResult,
    medChanges,
    recent,
    typeSeries,
    typesPresent: typesPresent(rangeEpisodes),
    durationSeries,
    durationStats: durStats,
    firstEpisodeAt: firstAt ? firstAt.toISOString() : null,
  };
}
