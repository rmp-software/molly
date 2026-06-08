import { describe, it, expect } from "vitest";
import {
  markCluster,
  timeSinceLast,
  longestGapDays,
  breakdown,
  perPeriod,
  monthlyAverage,
  perPeriodByType,
  typesPresent,
  avgDurationPerPeriod,
  durationStats,
  firstEpisodeAt,
  type Episode,
} from "./stats";

// Helper: build a date at midnight local time
const d = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

// Helper: build a datetime
const dt = (year: number, month: number, day: number, hour: number, minute = 0) =>
  new Date(year, month - 1, day, hour, minute, 0, 0);

// Helper: episode factory
const ep = (
  at: Date,
  type: Episode["type"] = "tonic_clonic",
  severity: Episode["severity"] = null,
  durationSeconds: number | null = null
): Episode => ({ occurredAt: at, type, severity, durationSeconds });

describe("markCluster", () => {
  /**
   * Returns true if any other date is within ≤24h (either side) of candidate.
   * "Within 24h" means |other - candidate| <= 24 * 3600 * 1000 ms.
   * The intent: cluster detection is bidirectional — a seizure that happened
   * 20h before OR 20h after the candidate counts as clustering.
   */

  it("returns false for empty others array", () => {
    expect(markCluster(dt(2026, 1, 5, 10), [])).toBe(false);
  });

  it("returns true when another event is exactly 24h before", () => {
    const candidate = dt(2026, 1, 5, 10);
    const other = dt(2026, 1, 4, 10); // exactly 24h before
    expect(markCluster(candidate, [other])).toBe(true);
  });

  it("returns true when another event is exactly 24h after", () => {
    const candidate = dt(2026, 1, 5, 10);
    const other = dt(2026, 1, 6, 10); // exactly 24h after
    expect(markCluster(candidate, [other])).toBe(true);
  });

  it("returns true when another event is 12h before", () => {
    const candidate = dt(2026, 1, 5, 12);
    const other = dt(2026, 1, 5, 0);
    expect(markCluster(candidate, [other])).toBe(true);
  });

  it("returns false when closest event is just over 24h away", () => {
    const candidate = dt(2026, 1, 5, 10);
    const other = new Date(candidate.getTime() - 24 * 3600 * 1000 - 1); // 1ms over
    expect(markCluster(candidate, [other])).toBe(false);
  });

  it("returns false when all others are more than 24h away", () => {
    const candidate = dt(2026, 1, 5, 10);
    const others = [dt(2026, 1, 2, 10), dt(2026, 1, 9, 10)]; // 3 days away each
    expect(markCluster(candidate, others)).toBe(false);
  });

  it("returns true if at least one of multiple others is within 24h", () => {
    const candidate = dt(2026, 1, 5, 10);
    const others = [
      dt(2026, 1, 2, 10), // 3 days away
      dt(2026, 1, 5, 20), // 10h away
    ];
    expect(markCluster(candidate, others)).toBe(true);
  });
});

describe("timeSinceLast", () => {
  it("returns null for empty episodes", () => {
    expect(timeSinceLast([], dt(2026, 1, 10, 12))).toBeNull();
  });

  it("returns null when all episodes are after now", () => {
    const episodes = [ep(dt(2026, 2, 1, 10))];
    expect(timeSinceLast(episodes, dt(2026, 1, 10, 12))).toBeNull();
  });

  it("returns ms and days since the most recent episode <= now", () => {
    const now = dt(2026, 1, 10, 12);
    const episodes = [
      ep(dt(2026, 1, 5, 12)), // 5 days ago
      ep(dt(2026, 1, 8, 12)), // 2 days ago (most recent)
    ];
    const result = timeSinceLast(episodes, now);
    expect(result).not.toBeNull();
    const expectedMs = 2 * 24 * 3600 * 1000;
    expect(result!.ms).toBe(expectedMs);
    expect(result!.days).toBe(2);
  });

  it("floors partial days", () => {
    const now = dt(2026, 1, 10, 18);
    const last = dt(2026, 1, 9, 6); // 1 day 12 hours ago
    const result = timeSinceLast([ep(last)], now);
    expect(result!.days).toBe(1);
  });

  it("returns 0 days when episode was less than a day ago", () => {
    const now = dt(2026, 1, 10, 12);
    const last = dt(2026, 1, 10, 6); // 6h ago
    const result = timeSinceLast([ep(last)], now);
    expect(result!.days).toBe(0);
  });
});

describe("longestGapDays", () => {
  it("returns null for empty array", () => {
    expect(longestGapDays([])).toBeNull();
  });

  it("returns null for single episode", () => {
    expect(longestGapDays([ep(d(2026, 1, 1))])).toBeNull();
  });

  it("returns the gap in whole days between two episodes", () => {
    const episodes = [ep(d(2026, 1, 1)), ep(d(2026, 1, 11))];
    expect(longestGapDays(episodes)).toBe(10);
  });

  it("returns the longest gap among multiple consecutive pairs", () => {
    const episodes = [
      ep(d(2026, 1, 1)),
      ep(d(2026, 1, 4)), // gap 3
      ep(d(2026, 1, 20)), // gap 16 ← longest
      ep(d(2026, 1, 25)), // gap 5
    ];
    expect(longestGapDays(episodes)).toBe(16);
  });

  it("handles unsorted input by sorting first", () => {
    const episodes = [
      ep(d(2026, 1, 20)),
      ep(d(2026, 1, 1)),
      ep(d(2026, 1, 4)),
    ];
    expect(longestGapDays(episodes)).toBe(16);
  });

  it("floors fractional-day gaps", () => {
    const a = dt(2026, 1, 1, 0);
    const b = dt(2026, 1, 3, 12); // 2.5 days
    expect(longestGapDays([ep(a), ep(b)])).toBe(2);
  });
});

describe("breakdown", () => {
  const episodes: Episode[] = [
    ep(dt(2026, 1, 1, 8), "tonic_clonic", "severe"),
    ep(dt(2026, 1, 2, 10), "tonic_clonic", "mild"),
    ep(dt(2026, 1, 3, 14), "focal", null),
    ep(dt(2026, 1, 4, 22), "absence", "moderate"),
    ep(dt(2026, 1, 5, 14), "other", null),
  ];

  it("counts by type correctly", () => {
    const result = breakdown(episodes);
    expect(result.byType["tonic_clonic"]).toBe(2);
    expect(result.byType["focal"]).toBe(1);
    expect(result.byType["absence"]).toBe(1);
    expect(result.byType["other"]).toBe(1);
  });

  it("counts by severity (null severity → 'unknown')", () => {
    const result = breakdown(episodes);
    expect(result.bySeverity["severe"]).toBe(1);
    expect(result.bySeverity["mild"]).toBe(1);
    expect(result.bySeverity["moderate"]).toBe(1);
    // focal and other have null severity → bucketed as "unknown"
    expect(result.bySeverity["unknown"]).toBe(2);
  });

  it("byHour is a length-24 array", () => {
    const result = breakdown(episodes);
    expect(result.byHour).toHaveLength(24);
  });

  it("counts by hour correctly", () => {
    const result = breakdown(episodes);
    expect(result.byHour[8]).toBe(1); // 08:00
    expect(result.byHour[10]).toBe(1); // 10:00
    expect(result.byHour[14]).toBe(2); // 14:00 (two episodes)
    expect(result.byHour[22]).toBe(1); // 22:00
    expect(result.byHour[0]).toBe(0);
  });

  it("returns zero-filled byHour array for empty input", () => {
    const result = breakdown([]);
    expect(result.byHour.every((n) => n === 0)).toBe(true);
    expect(result.byHour).toHaveLength(24);
  });
});

describe("perPeriod — month", () => {
  /**
   * Month buckets = calendar months; label = pt-BR short month name
   * Episodes outside [from, to) are excluded.
   */
  const episodes: Episode[] = [
    ep(dt(2026, 1, 5, 10)),
    ep(dt(2026, 1, 20, 10)),
    ep(dt(2026, 2, 10, 10)),
    ep(dt(2026, 3, 1, 10)),
    ep(dt(2026, 3, 15, 10)),
    ep(dt(2026, 3, 28, 10)),
  ];
  const range = { from: d(2026, 1, 1), to: d(2026, 4, 1) };

  it("produces one bucket per calendar month in range", () => {
    const result = perPeriod(episodes, "month", range);
    expect(result).toHaveLength(3);
  });

  it("labels months in pt-BR short form", () => {
    const result = perPeriod(episodes, "month", range);
    const labels = result.map((b) => b.label);
    expect(labels).toEqual(["jan", "fev", "mar"]);
  });

  it("counts episodes per month correctly", () => {
    const result = perPeriod(episodes, "month", range);
    expect(result[0].count).toBe(2); // jan
    expect(result[1].count).toBe(1); // fev
    expect(result[2].count).toBe(3); // mar
  });

  it("returns buckets with correct start dates", () => {
    const result = perPeriod(episodes, "month", range);
    expect(result[0].start.getMonth()).toBe(0); // Jan
    expect(result[1].start.getMonth()).toBe(1); // Feb
    expect(result[2].start.getMonth()).toBe(2); // Mar
  });
});

describe("perPeriod — week", () => {
  /**
   * Week buckets: 7-day bins starting from `range.from`.
   * Label: "dd/mm" of the bin start date.
   */
  const from = d(2026, 1, 1); // 2026-01-01
  const to = d(2026, 1, 22); // 3 complete 7-day bins
  const range = { from, to };

  const episodes: Episode[] = [
    ep(dt(2026, 1, 1, 10)), // bin 0: [Jan 1, Jan 8)
    ep(dt(2026, 1, 6, 10)), // bin 0
    ep(dt(2026, 1, 8, 10)), // bin 1: [Jan 8, Jan 15)
    ep(dt(2026, 1, 14, 10)), // bin 1
    ep(dt(2026, 1, 15, 10)), // bin 2: [Jan 15, Jan 22)
    ep(dt(2026, 1, 21, 10)), // bin 2
  ];

  it("produces correct number of week bins", () => {
    const result = perPeriod(episodes, "week", range);
    expect(result).toHaveLength(3);
  });

  it("labels bins as dd/mm of the bin start", () => {
    const result = perPeriod(episodes, "week", range);
    expect(result[0].label).toBe("01/01");
    expect(result[1].label).toBe("08/01");
    expect(result[2].label).toBe("15/01");
  });

  it("counts episodes per week bin correctly", () => {
    const result = perPeriod(episodes, "week", range);
    expect(result[0].count).toBe(2);
    expect(result[1].count).toBe(2);
    expect(result[2].count).toBe(2);
  });

  it("partial bin at the end is still included with correct count", () => {
    const partialTo = d(2026, 1, 20); // bin2 goes Jan 15–20 (partial)
    const result = perPeriod(episodes, "week", { from, to: partialTo });
    expect(result).toHaveLength(3);
    // only Jan 15 falls in partial bin2 (Jan 21 is excluded by to=Jan20)
    expect(result[2].count).toBe(1);
  });
});

describe("perPeriod — month lower-bound clamp (Fix 1)", () => {
  /**
   * Regression: when range.from is mid-month, the first bucket must NOT count
   * episodes that fall before range.from (even though they are in the same
   * calendar month).
   *
   * Reproducer: range={from: Jan 15, to: Feb 1}, episodes at Jan 10 and Jan 20.
   * Jan bucket count must be 1 (Jan 10 is before range.from and must be excluded).
   */
  it("excludes episodes before range.from in the first month bucket", () => {
    const range = { from: new Date(2026, 0, 15), to: new Date(2026, 1, 1) };
    const episodes: Episode[] = [
      ep(dt(2026, 1, 10, 10)), // Jan 10 — before range.from (Jan 15)
      ep(dt(2026, 1, 20, 10)), // Jan 20 — within range
    ];
    const result = perPeriod(episodes, "month", range);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("jan");
    expect(result[0].count).toBe(1); // only Jan 20 should be counted
  });
});

describe("monthlyAverage", () => {
  it("returns 0 for empty episodes", () => {
    const range = { from: d(2026, 1, 1), to: d(2026, 4, 1) };
    expect(monthlyAverage([], range)).toBe(0);
  });

  it("counts only episodes within range", () => {
    const range = { from: d(2026, 1, 1), to: d(2026, 4, 1) };
    const episodes: Episode[] = [
      ep(dt(2026, 1, 5, 10)), // in range
      ep(dt(2026, 2, 10, 10)), // in range
      ep(dt(2025, 12, 31, 10)), // before range
      ep(dt(2026, 4, 1, 10)), // on boundary 'to' — excluded
    ];
    // 2 episodes in range, spanning Jan–Mar = 3 months
    expect(monthlyAverage(episodes, range)).toBeCloseTo(2 / 3);
  });

  it("calculates correct average for full months", () => {
    const range = { from: d(2026, 1, 1), to: d(2026, 4, 1) }; // 3 months
    const episodes: Episode[] = [
      ep(dt(2026, 1, 5, 10)),
      ep(dt(2026, 1, 20, 10)),
      ep(dt(2026, 2, 10, 10)),
      ep(dt(2026, 3, 1, 10)),
      ep(dt(2026, 3, 15, 10)),
      ep(dt(2026, 3, 28, 10)),
    ];
    // 6 episodes / 3 months = 2.0
    expect(monthlyAverage(episodes, range)).toBeCloseTo(2.0);
  });

  it("handles a single month", () => {
    const range = { from: d(2026, 1, 1), to: d(2026, 2, 1) }; // 1 month
    const episodes: Episode[] = [
      ep(dt(2026, 1, 5, 10)),
      ep(dt(2026, 1, 20, 10)),
    ];
    expect(monthlyAverage(episodes, range)).toBeCloseTo(2.0);
  });
});

describe("perPeriodByType — month", () => {
  /**
   * Same bucketing as perPeriod, but byType splits the count per SeizureType.
   * total = sum of byType. Out-of-range episodes excluded. Totals must match
   * perPeriod for the same input. Zero-count types are OMITTED from byType.
   */
  const episodes: Episode[] = [
    ep(dt(2026, 1, 5, 10), "tonic_clonic"),
    ep(dt(2026, 1, 20, 10), "focal"),
    ep(dt(2026, 2, 10, 10), "tonic_clonic"),
    ep(dt(2026, 3, 1, 10), "absence"),
    ep(dt(2026, 3, 15, 10), "tonic_clonic"),
    ep(dt(2026, 3, 28, 10), "other"),
    ep(dt(2025, 12, 31, 10), "focal"), // before range — excluded
    ep(dt(2026, 4, 1, 10), "focal"), // on `to` boundary — excluded
  ];
  const range = { from: d(2026, 1, 1), to: d(2026, 4, 1) };

  it("splits per-type counts per bucket", () => {
    const result = perPeriodByType(episodes, "month", range);
    expect(result).toHaveLength(3);
    expect(result[0].byType).toEqual({ tonic_clonic: 1, focal: 1 }); // jan
    expect(result[1].byType).toEqual({ tonic_clonic: 1 }); // fev
    expect(result[2].byType).toEqual({
      absence: 1,
      tonic_clonic: 1,
      other: 1,
    }); // mar
  });

  it("total equals sum of byType for each bucket", () => {
    const result = perPeriodByType(episodes, "month", range);
    for (const b of result) {
      const sum = Object.values(b.byType).reduce((a, n) => a + n, 0);
      expect(b.total).toBe(sum);
    }
    expect(result.map((b) => b.total)).toEqual([2, 1, 3]);
  });

  it("omits zero-count types from byType", () => {
    const result = perPeriodByType(episodes, "month", range);
    expect(result[1].byType).not.toHaveProperty("focal");
    expect(result[1].byType).not.toHaveProperty("absence");
  });

  it("month totals match perPeriod counts for the same input", () => {
    const byType = perPeriodByType(episodes, "month", range);
    const plain = perPeriod(episodes, "month", range);
    expect(byType.map((b) => b.total)).toEqual(plain.map((b) => b.count));
    expect(byType.map((b) => b.label)).toEqual(plain.map((b) => b.label));
    expect(byType.map((b) => b.start.getTime())).toEqual(
      plain.map((b) => b.start.getTime())
    );
  });
});

describe("perPeriodByType — week", () => {
  const from = d(2026, 1, 1);
  const to = d(2026, 1, 22);
  const range = { from, to };
  const episodes: Episode[] = [
    ep(dt(2026, 1, 1, 10), "tonic_clonic"), // bin 0
    ep(dt(2026, 1, 6, 10), "focal"), // bin 0
    ep(dt(2026, 1, 8, 10), "tonic_clonic"), // bin 1
    ep(dt(2026, 1, 14, 10), "tonic_clonic"), // bin 1
    ep(dt(2026, 1, 15, 10), "absence"), // bin 2
    ep(dt(2026, 1, 21, 10), "other"), // bin 2
  ];

  it("splits per-type counts per week bin", () => {
    const result = perPeriodByType(episodes, "week", range);
    expect(result).toHaveLength(3);
    expect(result[0].byType).toEqual({ tonic_clonic: 1, focal: 1 });
    expect(result[1].byType).toEqual({ tonic_clonic: 2 });
    expect(result[2].byType).toEqual({ absence: 1, other: 1 });
  });

  it("week totals match perPeriod counts for the same input", () => {
    const byType = perPeriodByType(episodes, "week", range);
    const plain = perPeriod(episodes, "week", range);
    expect(byType.map((b) => b.total)).toEqual(plain.map((b) => b.count));
    expect(byType.map((b) => b.label)).toEqual(plain.map((b) => b.label));
  });

  it("returns a single bucket for a range shorter than one week", () => {
    const shortRange = { from: d(2026, 1, 1), to: d(2026, 1, 4) };
    const result = perPeriodByType(episodes, "week", shortRange);
    expect(result).toHaveLength(1);
    expect(result[0].byType).toEqual({ tonic_clonic: 1 });
    expect(result[0].total).toBe(1);
  });

  it("handles empty input — bucket present with empty byType and total 0", () => {
    const result = perPeriodByType([], "week", range);
    expect(result).toHaveLength(3);
    for (const b of result) {
      expect(b.byType).toEqual({});
      expect(b.total).toBe(0);
    }
  });
});

describe("typesPresent", () => {
  it("returns empty array for no episodes", () => {
    expect(typesPresent([])).toEqual([]);
  });

  it("omits zero-count types and returns canonical order", () => {
    const episodes: Episode[] = [
      ep(d(2026, 1, 1), "other"),
      ep(d(2026, 1, 2), "tonic_clonic"),
      ep(d(2026, 1, 3), "absence"),
      ep(d(2026, 1, 4), "tonic_clonic"),
    ];
    // focal absent; canonical order: tonic_clonic, focal, absence, other
    expect(typesPresent(episodes)).toEqual([
      "tonic_clonic",
      "absence",
      "other",
    ]);
  });

  it("returns all four in canonical order when all present", () => {
    const episodes: Episode[] = [
      ep(d(2026, 1, 1), "other"),
      ep(d(2026, 1, 2), "absence"),
      ep(d(2026, 1, 3), "focal"),
      ep(d(2026, 1, 4), "tonic_clonic"),
    ];
    expect(typesPresent(episodes)).toEqual([
      "tonic_clonic",
      "focal",
      "absence",
      "other",
    ]);
  });
});

describe("avgDurationPerPeriod", () => {
  /**
   * Averages durations of ONLY the given type with non-null durationSeconds.
   * avgSeconds null & n 0 for empty buckets.
   */
  const from = d(2026, 1, 1);
  const to = d(2026, 1, 22);
  const range = { from, to };

  it("averages only the matching type with non-null durations", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 1, 1, 10), "tonic_clonic", null, 60), // bin 0
      ep(dt(2026, 1, 6, 10), "tonic_clonic", null, 120), // bin 0
      ep(dt(2026, 1, 6, 12), "focal", null, 999), // other type — ignored
      ep(dt(2026, 1, 6, 14), "tonic_clonic", null, null), // null duration — ignored
      ep(dt(2026, 1, 8, 10), "tonic_clonic", null, 30), // bin 1
    ];
    const result = avgDurationPerPeriod(episodes, "week", range, "tonic_clonic");
    expect(result).toHaveLength(3);
    expect(result[0].n).toBe(2);
    expect(result[0].avgSeconds).toBeCloseTo(90); // (60+120)/2
    expect(result[1].n).toBe(1);
    expect(result[1].avgSeconds).toBeCloseTo(30);
  });

  it("returns avgSeconds null and n 0 for empty buckets", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 1, 1, 10), "tonic_clonic", null, 60), // bin 0 only
    ];
    const result = avgDurationPerPeriod(episodes, "week", range, "tonic_clonic");
    expect(result[1].n).toBe(0);
    expect(result[1].avgSeconds).toBeNull();
    expect(result[2].n).toBe(0);
    expect(result[2].avgSeconds).toBeNull();
  });

  it("returns all-null when every matching duration is null", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 1, 1, 10), "tonic_clonic", null, null),
      ep(dt(2026, 1, 8, 10), "tonic_clonic", null, null),
    ];
    const result = avgDurationPerPeriod(episodes, "week", range, "tonic_clonic");
    for (const b of result) {
      expect(b.n).toBe(0);
      expect(b.avgSeconds).toBeNull();
    }
  });

  // Production uses month buckets (3m/6m/12m/all ranges). Week-vs-month parity.
  describe("month bucket", () => {
    const monthRange = { from: d(2026, 1, 1), to: d(2026, 4, 1) }; // jan, fev, mar

    it("computes per-month averages and null for empty month buckets", () => {
      const episodes: Episode[] = [
        // jan: (60 + 120) / 2 = 90
        ep(dt(2026, 1, 5, 10), "tonic_clonic", null, 60),
        ep(dt(2026, 1, 20, 10), "tonic_clonic", null, 120),
        ep(dt(2026, 1, 21, 10), "focal", null, 999), // other type — ignored
        ep(dt(2026, 1, 22, 10), "tonic_clonic", null, null), // null — ignored
        // fev: empty for tonic_clonic → null
        ep(dt(2026, 2, 10, 10), "focal", null, 50), // other type only
        // mar: single qualifying → 200
        ep(dt(2026, 3, 15, 10), "tonic_clonic", null, 200),
      ];
      const result = avgDurationPerPeriod(
        episodes,
        "month",
        monthRange,
        "tonic_clonic"
      );
      expect(result).toHaveLength(3);
      expect(result[0].n).toBe(2);
      expect(result[0].avgSeconds).toBeCloseTo(90);
      expect(result[1].n).toBe(0); // fev: no qualifying tonic_clonic
      expect(result[1].avgSeconds).toBeNull();
      expect(result[2].n).toBe(1);
      expect(result[2].avgSeconds).toBeCloseTo(200);
    });

    it("month per-bucket n totals match perPeriodByType month totals per type", () => {
      // Parity analogous to the perPeriodByType parity test: summing per-type n
      // (all episodes here have non-null duration) across buckets must equal the
      // per-type counts perPeriodByType reports for the same month buckets.
      const episodes: Episode[] = [
        ep(dt(2026, 1, 5, 10), "tonic_clonic", null, 60),
        ep(dt(2026, 1, 20, 10), "tonic_clonic", null, 120),
        ep(dt(2026, 2, 10, 10), "tonic_clonic", null, 80),
        ep(dt(2026, 3, 15, 10), "tonic_clonic", null, 200),
      ];
      const avg = avgDurationPerPeriod(
        episodes,
        "month",
        monthRange,
        "tonic_clonic"
      );
      const byType = perPeriodByType(episodes, "month", monthRange);
      // Each bucket's avg-period n (non-null durations of the type) must equal
      // that bucket's byType count for the type, and the labels/starts align.
      expect(avg.map((b) => b.n)).toEqual(
        byType.map((b) => b.byType.tonic_clonic ?? 0)
      );
      expect(avg.map((b) => b.label)).toEqual(byType.map((b) => b.label));
      expect(avg.map((b) => b.start.getTime())).toEqual(
        byType.map((b) => b.start.getTime())
      );
    });
  });
});

describe("durationStats", () => {
  /**
   * currentAvg = mean duration of `type` w/ non-null duration in [from, to)
   * previousAvg = same for [from-(to-from), from)
   * deltaSeconds = currentAvg - previousAvg (null if either null)
   * direction = sign of least-squares slope of per-bucket avg (current range),
   *   computed over the caller-supplied `bucket` granularity
   * emergencyCount = count of `type` in current range w/ durationSeconds >= 60
   * maxSeconds = max over ALL non-null durations of `type` in the current range,
   *   regardless of the 60s emergency threshold (NOT restricted to the >=60s
   *   episodes counted by emergencyCount); null when none qualify.
   */
  const range = { from: d(2026, 2, 1), to: d(2026, 3, 1) }; // current month
  // previous window: Jan 1 .. Feb 1

  it("computes current and previous averages and delta", () => {
    const episodes: Episode[] = [
      // previous window (Jan): avg = (40+80)/2 = 60
      ep(dt(2026, 1, 5, 10), "tonic_clonic", null, 40),
      ep(dt(2026, 1, 20, 10), "tonic_clonic", null, 80),
      // current window (Feb): avg = (100+120)/2 = 110
      ep(dt(2026, 2, 5, 10), "tonic_clonic", null, 100),
      ep(dt(2026, 2, 20, 10), "tonic_clonic", null, 120),
    ];
    const r = durationStats(episodes, range, "tonic_clonic", "month");
    expect(r.currentAvg).toBeCloseTo(110);
    expect(r.previousAvg).toBeCloseTo(60);
    expect(r.deltaSeconds).toBeCloseTo(50);
  });

  it("delta null when previous window has no qualifying episodes", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 2, 5, 10), "tonic_clonic", null, 100),
    ];
    const r = durationStats(episodes, range, "tonic_clonic", "month");
    expect(r.currentAvg).toBeCloseTo(100);
    expect(r.previousAvg).toBeNull();
    expect(r.deltaSeconds).toBeNull();
  });

  it("currentAvg null and delta null when current window empty", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 1, 5, 10), "tonic_clonic", null, 40),
    ];
    const r = durationStats(episodes, range, "tonic_clonic", "month");
    expect(r.currentAvg).toBeNull();
    expect(r.deltaSeconds).toBeNull();
  });

  it("direction is up when per-bucket avg rises across the range", () => {
    // weekly buckets over a 3-week range, avg climbs 30 -> 60 -> 120
    const wr = { from: d(2026, 2, 1), to: d(2026, 2, 22) };
    const episodes: Episode[] = [
      ep(dt(2026, 2, 1, 10), "tonic_clonic", null, 30),
      ep(dt(2026, 2, 8, 10), "tonic_clonic", null, 60),
      ep(dt(2026, 2, 15, 10), "tonic_clonic", null, 120),
    ];
    const r = durationStats(episodes, wr, "tonic_clonic", "week");
    expect(r.direction).toBe("up");
  });

  it("direction is down when per-bucket avg falls across the range", () => {
    const wr = { from: d(2026, 2, 1), to: d(2026, 2, 22) };
    const episodes: Episode[] = [
      ep(dt(2026, 2, 1, 10), "tonic_clonic", null, 120),
      ep(dt(2026, 2, 8, 10), "tonic_clonic", null, 60),
      ep(dt(2026, 2, 15, 10), "tonic_clonic", null, 30),
    ];
    const r = durationStats(episodes, wr, "tonic_clonic", "week");
    expect(r.direction).toBe("down");
  });

  it("direction is flat with fewer than 2 data points", () => {
    const wr = { from: d(2026, 2, 1), to: d(2026, 2, 22) };
    const episodes: Episode[] = [
      ep(dt(2026, 2, 1, 10), "tonic_clonic", null, 90),
    ];
    const r = durationStats(episodes, wr, "tonic_clonic", "week");
    expect(r.direction).toBe("flat");
  });

  it("direction is flat when per-bucket avg is unchanging", () => {
    const wr = { from: d(2026, 2, 1), to: d(2026, 2, 22) };
    const episodes: Episode[] = [
      ep(dt(2026, 2, 1, 10), "tonic_clonic", null, 90),
      ep(dt(2026, 2, 8, 10), "tonic_clonic", null, 90),
      ep(dt(2026, 2, 15, 10), "tonic_clonic", null, 90),
    ];
    const r = durationStats(episodes, wr, "tonic_clonic", "week");
    expect(r.direction).toBe("flat");
  });

  // Month-mode direction tests exercise the production path (3m/6m/12m ranges
  // feed bucket="month"). Span here is > 63 days, the old heuristic boundary.
  it("direction is up over month buckets (production path)", () => {
    const mr = { from: d(2026, 1, 1), to: d(2026, 4, 1) }; // 3 months
    const episodes: Episode[] = [
      ep(dt(2026, 1, 10, 10), "tonic_clonic", null, 30), // jan avg 30
      ep(dt(2026, 2, 10, 10), "tonic_clonic", null, 60), // fev avg 60
      ep(dt(2026, 3, 10, 10), "tonic_clonic", null, 120), // mar avg 120
    ];
    const r = durationStats(episodes, mr, "tonic_clonic", "month");
    expect(r.direction).toBe("up");
  });

  it("direction is down over month buckets (production path)", () => {
    const mr = { from: d(2026, 1, 1), to: d(2026, 4, 1) }; // 3 months
    const episodes: Episode[] = [
      ep(dt(2026, 1, 10, 10), "tonic_clonic", null, 120), // jan avg 120
      ep(dt(2026, 2, 10, 10), "tonic_clonic", null, 60), // fev avg 60
      ep(dt(2026, 3, 10, 10), "tonic_clonic", null, 30), // mar avg 30
    ];
    const r = durationStats(episodes, mr, "tonic_clonic", "month");
    expect(r.direction).toBe("down");
  });

  it("direction is flat over month buckets when avg is unchanging", () => {
    const mr = { from: d(2026, 1, 1), to: d(2026, 4, 1) }; // 3 months
    const episodes: Episode[] = [
      ep(dt(2026, 1, 10, 10), "tonic_clonic", null, 90),
      ep(dt(2026, 2, 10, 10), "tonic_clonic", null, 90),
      ep(dt(2026, 3, 10, 10), "tonic_clonic", null, 90),
    ];
    const r = durationStats(episodes, mr, "tonic_clonic", "month");
    expect(r.direction).toBe("flat");
  });

  it("trend direction depends on the bucket argument (week vs month diverge)", () => {
    // The whole point of the bucket parameter: for one range, the slope over
    // weekly buckets need not agree with the slope over monthly buckets. The
    // caller MUST pass the same bucket it charts, or the hint can contradict the
    // rendered line. This dataset is constructed so the two disagree.
    //
    //   Monthly averages (chronological): jan = 100, fev = 50  → slope < 0 → down.
    //   Weekly non-null averages (chronological): week of Jan 26 = 100, then
    //   week of Feb 23 = 50 are the only qualifying weeks plus an earlier low
    //   Jan week — arranged so the weekly least-squares slope is positive (up).
    const mr = { from: d(2026, 1, 1), to: d(2026, 3, 1) };
    const episodes: Episode[] = [
      // January, month avg 100: one early low week + one late high week.
      ep(dt(2026, 1, 5, 10), "tonic_clonic", null, 20), // week 0
      ep(dt(2026, 1, 26, 10), "tonic_clonic", null, 180), // week 3
      // February, month avg 50: a single qualifying week, mid value.
      ep(dt(2026, 2, 9, 10), "tonic_clonic", null, 50), // later week
    ];
    const monthDir = durationStats(episodes, mr, "tonic_clonic", "month").direction;
    const weekDir = durationStats(episodes, mr, "tonic_clonic", "week").direction;
    // Month avgs 100 → 50: down.
    expect(monthDir).toBe("down");
    // Weekly non-null avgs chronologically 20, 180, 50: least-squares slope > 0: up.
    expect(weekDir).toBe("up");
    // The two disagree — that's the contradiction the bucket arg eliminates.
    expect(monthDir).not.toBe(weekDir);
  });

  it("emergencyCount is inclusive at exactly 60s; maxSeconds is the max", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 2, 5, 10), "tonic_clonic", null, 59), // below threshold
      ep(dt(2026, 2, 6, 10), "tonic_clonic", null, 60), // exactly 60 — counts
      ep(dt(2026, 2, 7, 10), "tonic_clonic", null, 200), // counts
      ep(dt(2026, 2, 8, 10), "focal", null, 300), // other type — ignored
      ep(dt(2026, 2, 9, 10), "tonic_clonic", null, null), // null — ignored
    ];
    const r = durationStats(episodes, range, "tonic_clonic", "month");
    expect(r.emergencyCount).toBe(2);
    expect(r.maxSeconds).toBe(200);
  });

  it("maxSeconds is the max over ALL non-null durations, not just >=60s episodes", () => {
    // Current window (Feb) holds a single sub-60s tonic_clonic episode. If
    // maxSeconds were (incorrectly) restricted to >=60s emergencies it would be
    // null here; the contract is max over ALL non-null durations → 45.
    const episodes: Episode[] = [
      ep(dt(2026, 2, 10, 10), "tonic_clonic", null, 45), // below 60s threshold
    ];
    const r = durationStats(episodes, range, "tonic_clonic", "month");
    expect(r.maxSeconds).toBe(45);
    expect(r.emergencyCount).toBe(0);
    expect(r.currentAvg).toBe(45);
  });

  it("maxSeconds null when no qualifying current episodes", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 1, 5, 10), "tonic_clonic", null, 100), // previous window only
    ];
    const r = durationStats(episodes, range, "tonic_clonic", "month");
    expect(r.emergencyCount).toBe(0);
    expect(r.maxSeconds).toBeNull();
  });
});

describe("firstEpisodeAt", () => {
  it("returns null for empty input", () => {
    expect(firstEpisodeAt([])).toBeNull();
  });

  it("returns the earliest occurredAt", () => {
    const episodes: Episode[] = [
      ep(dt(2026, 1, 20, 10)),
      ep(dt(2026, 1, 5, 10)), // earliest
      ep(dt(2026, 2, 1, 10)),
    ];
    expect(firstEpisodeAt(episodes)).toEqual(dt(2026, 1, 5, 10));
  });

  it("returns the only episode's date for a single episode", () => {
    const only = dt(2026, 3, 3, 9);
    expect(firstEpisodeAt([ep(only)])).toEqual(only);
  });
});
