import { describe, it, expect } from "vitest";
import {
  markCluster,
  timeSinceLast,
  longestGapDays,
  breakdown,
  perPeriod,
  monthlyAverage,
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
