import { describe, it, expect } from "vitest";
import { buildTrendsPayload, type SerializedEpisode } from "./trends";
import { type Episode, longestGapDays, timeSinceLast } from "./stats";

// Helper: datetime at local midnight + optional time
const dt = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
) => new Date(year, month - 1, day, hour, minute, 0, 0);

const ep = (
  at: Date,
  type: Episode["type"] = "tonic_clonic",
  severity: Episode["severity"] = null,
  durationSeconds: number | null = null
): Episode => ({ occurredAt: at, type, severity, durationSeconds });

const NOW = dt(2026, 6, 1, 12);

// A representative range spanning a few months with a mix of types & durations.
const FROM = dt(2026, 1, 1);
const TO = dt(2026, 4, 1);

const baseOpts = {
  from: FROM,
  to: TO,
  bucket: "month" as const,
  now: NOW,
  medSchedules: [],
  recent: [] as SerializedEpisode[],
};

describe("buildTrendsPayload", () => {
  const episodes: Episode[] = [
    // January
    ep(dt(2026, 1, 10), "tonic_clonic", "severe", 90),
    ep(dt(2026, 1, 20), "focal", "mild", 30),
    // February
    ep(dt(2026, 2, 5), "tonic_clonic", "moderate", 45),
    ep(dt(2026, 2, 6), "absence", null, null),
    // March
    ep(dt(2026, 3, 15), "tonic_clonic", "severe", 120),
    // Outside the range (December prior year) — must be excluded from range aggregates
    ep(dt(2025, 12, 31), "focal", "mild", 10),
  ];

  it("returns a payload with all expected top-level keys", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    expect(Object.keys(payload).sort()).toEqual(
      [
        "breakdown",
        "bucket",
        "durationSeries",
        "durationStats",
        "firstEpisodeAt",
        "medChanges",
        "range",
        "recent",
        "series",
        "stats",
        "typeSeries",
        "typesPresent",
      ].sort()
    );
  });

  it("preserves existing fields: range, bucket, series shape", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    expect(payload.range).toEqual({
      from: FROM.toISOString(),
      to: TO.toISOString(),
    });
    expect(payload.bucket).toBe("month");
    // month bucket over Jan–Apr (exclusive) => 3 buckets
    expect(payload.series).toHaveLength(3);
    for (const s of payload.series) {
      expect(typeof s.label).toBe("string");
      expect(typeof s.start).toBe("string");
      expect(typeof s.count).toBe("number");
    }
  });

  it("series per-bucket totals equal the sum of that bucket's typeSeries.byType", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    expect(payload.typeSeries).toHaveLength(payload.series.length);
    payload.series.forEach((s, i) => {
      const ts = payload.typeSeries[i];
      const byTypeSum = Object.values(ts.byType).reduce(
        (a, n) => a + (n ?? 0),
        0
      );
      expect(byTypeSum).toBe(s.count);
      expect(ts.total).toBe(s.count);
      // start ISO must line up bucket-for-bucket
      expect(ts.start).toBe(s.start);
    });
  });

  it("durationSeries.length === series.length", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    expect(payload.durationSeries).toHaveLength(payload.series.length);
    for (const ds of payload.durationSeries) {
      expect(typeof ds.start).toBe("string");
      expect(ds.avgSeconds === null || typeof ds.avgSeconds === "number").toBe(
        true
      );
      expect(typeof ds.n).toBe("number");
    }
  });

  it("typesPresent reflects only the types in range, canonical order", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    // In range: tonic_clonic, focal, absence (the Dec focal is out of range)
    expect(payload.typesPresent).toEqual(["tonic_clonic", "focal", "absence"]);
  });

  it("durationStats covers tonic_clonic durations in range (emergencyCount @ >=60s, max)", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    // tonic_clonic durations in range: 90, 45, 120 -> avg 85, max 120, >=60 => 2
    expect(payload.durationStats.currentAvg).toBeCloseTo(85, 5);
    expect(payload.durationStats.maxSeconds).toBe(120);
    expect(payload.durationStats.emergencyCount).toBe(2);
  });

  it("durationStats.previousAvg/deltaSeconds use the prior equal-length window from ALL episodes (RMP-172)", () => {
    // Current range [Jan 1, Apr 1) has tonic_clonic durations 90, 45, 120 -> avg 85.
    // The immediately-preceding equal-length window is [Oct 1 2025, Jan 1 2026).
    // Add tonic_clonic durations 50 and 70 there -> previous avg 60.
    // These prior-window episodes are OUTSIDE rangeEpisodes, so they only show up
    // if durationStats receives the FULL allEpisodes set (the bug fix). Without
    // the fix, previousAvg/deltaSeconds are null and this test fails.
    const withPrior: Episode[] = [
      ...episodes,
      ep(dt(2025, 11, 5), "tonic_clonic", "moderate", 50),
      ep(dt(2025, 12, 10), "tonic_clonic", "severe", 70),
      // A prior-window non-tonic_clonic episode must NOT affect the average.
      ep(dt(2025, 11, 20), "focal", "mild", 999),
    ];
    const payload = buildTrendsPayload(withPrior, baseOpts);
    expect(payload.durationStats.currentAvg).toBeCloseTo(85, 5);
    expect(payload.durationStats.previousAvg).not.toBeNull();
    expect(payload.durationStats.previousAvg).toBeCloseTo(60, 5); // (50 + 70) / 2
    expect(payload.durationStats.deltaSeconds).not.toBeNull();
    expect(payload.durationStats.deltaSeconds).toBeCloseTo(25, 5); // 85 - 60
  });

  it("threads firstEpisodeAt from ALL episodes (not just the range)", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    // earliest overall is the out-of-range Dec 31 2025 episode
    expect(payload.firstEpisodeAt).toBe(dt(2025, 12, 31).toISOString());
  });

  it("firstEpisodeAt is null for empty input", () => {
    const payload = buildTrendsPayload([], baseOpts);
    expect(payload.firstEpisodeAt).toBeNull();
    expect(payload.typesPresent).toEqual([]);
    expect(payload.series.every((s) => s.count === 0)).toBe(true);
    // consistency still holds for the empty case
    expect(payload.durationSeries).toHaveLength(payload.series.length);
  });

  it("preserves stats: totalInRange, totalInYear, monthlyAverage", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    // 5 episodes within [Jan 1, Apr 1)
    expect(payload.stats.totalInRange).toBe(5);
    // totalInYear: episodes in 2026 => 5 (the Dec one is 2025)
    expect(payload.stats.totalInYear).toBe(5);
    // 5 episodes over 3 months
    expect(payload.stats.monthlyAverage).toBeCloseTo(5 / 3, 5);
  });

  it("preserves breakdown (byType / bySeverity / byHour) over the range", () => {
    const payload = buildTrendsPayload(episodes, baseOpts);
    expect(payload.breakdown.byType.tonic_clonic).toBe(3);
    expect(payload.breakdown.byType.focal).toBe(1);
    expect(payload.breakdown.byType.absence).toBe(1);
    expect(payload.breakdown.byHour).toHaveLength(24);
  });

  it("preserves recent and medChanges passthrough/annotation", () => {
    const recent: SerializedEpisode[] = [
      {
        id: "abc",
        occurredAt: dt(2026, 3, 15).toISOString(),
        type: "tonic_clonic",
        durationSeconds: 120,
        severity: "severe",
        isCluster: false,
        rescueGiven: true,
        notes: null,
      },
    ];
    const payload = buildTrendsPayload(episodes, {
      ...baseOpts,
      recent,
      medSchedules: [
        {
          effectiveFrom: dt(2026, 2, 10),
          unitsPerDose: 2,
          medication: { name: "Fenobarbital" },
        },
      ],
    });
    expect(payload.recent).toEqual(recent);
    expect(payload.medChanges).toHaveLength(1);
    expect(payload.medChanges[0].label).toBe("Fenobarbital 2×");
    // Feb 10 falls in the 2nd month bucket (index 1)
    expect(payload.medChanges[0].bucketIndex).toBe(1);
  });

  it("stats.longestGapDays and stats.timeSinceLast are computed from ALL episodes, not the range subset", () => {
    // Range is [Jan 1, Apr 1). We add an OUT-OF-RANGE episode on May 20 2026,
    // which sits after `to` but before `now` (Jun 1). Its presence changes BOTH
    // range-independent stats versus computing them from only in-range episodes:
    //   - timeSinceLast: most recent overall is May 20 (out of range), not the
    //     in-range Mar 15. NOW = Jun 1 12:00.
    //   - longestGapDays: the Mar 15 -> May 20 gap (66 days) is the longest,
    //     whereas the in-range subset's longest gap is much smaller.
    const allEpisodes: Episode[] = [
      ...episodes, // Dec 31 2025, Jan 10, Jan 20, Feb 5, Feb 6, Mar 15
      ep(dt(2026, 5, 20), "tonic_clonic", "moderate", 60),
    ];
    const rangeEpisodes = allEpisodes.filter(
      (e) => e.occurredAt >= FROM && e.occurredAt < TO
    );

    const payload = buildTrendsPayload(allEpisodes, baseOpts);

    // ── longestGapDays: derived from the FULL episode set ──
    const expectedGapFromAll = longestGapDays(allEpisodes);
    const gapFromRangeOnly = longestGapDays(rangeEpisodes);
    // Sanity: the fixture is constructed so the two differ — otherwise the test
    // would pass even if the impl wrongly used rangeEpisodes.
    expect(expectedGapFromAll).not.toBe(gapFromRangeOnly);
    expect(payload.stats.longestGapDays).toBe(expectedGapFromAll);
    // Mar 15 -> May 20 2026 is 66 whole days; that is the longest overall gap.
    expect(payload.stats.longestGapDays).toBe(66);

    // ── timeSinceLast: reflects the most recent episode relative to `now` ──
    const expectedTslFromAll = timeSinceLast(allEpisodes, NOW);
    const tslFromRangeOnly = timeSinceLast(rangeEpisodes, NOW);
    expect(expectedTslFromAll!.days).not.toBe(tslFromRangeOnly!.days);
    expect(payload.stats.timeSinceLast).not.toBeNull();
    expect(payload.stats.timeSinceLast!.days).toBe(expectedTslFromAll!.days);
    // NOW = Jun 1 2026 12:00, latest episode = May 20 2026 00:00 -> 12 whole days.
    expect(payload.stats.timeSinceLast!.days).toBe(12);
  });

  it('threads bucket: "week" through buildTrendsPayload (not hardcoded to "month")', () => {
    // Range [Jan 1, Apr 1) 2026 = 90 days -> ceil(90/7) = 13 week bins (7-day
    // bins from `from`, last bin partial), versus 3 calendar-month bins.
    const weekPayload = buildTrendsPayload(episodes, {
      ...baseOpts,
      bucket: "week",
    });
    const monthPayload = buildTrendsPayload(episodes, {
      ...baseOpts,
      bucket: "month",
    });

    expect(weekPayload.bucket).toBe("week");

    // All three series are bucketed identically and stay length-aligned.
    expect(weekPayload.series).toHaveLength(13);
    expect(weekPayload.durationSeries).toHaveLength(weekPayload.series.length);
    expect(weekPayload.typeSeries).toHaveLength(weekPayload.series.length);

    // Distinct from the month-bucketed result for the same range, proving the
    // bucket option is threaded through and not hardcoded to "month".
    expect(monthPayload.series).toHaveLength(3);
    expect(weekPayload.series.length).not.toBe(monthPayload.series.length);
  });
});
