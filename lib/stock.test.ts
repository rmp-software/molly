import { describe, it, expect } from "vitest";
import {
  currentStock,
  daysRemaining,
  reorderByDate,
  stockStatus,
  type StockTx,
} from "./stock";
import type { Schedule } from "./schedule";

// Helper: build a date at midnight local time
const d = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

// Shared open-ended schedule: 1 dose/day, 1 unit/dose → 1 unit/day
const onceDaily: Schedule = {
  doseTimes: ["08:00"],
  unitsPerDose: 1,
  effectiveFrom: d(2026, 1, 1),
  effectiveTo: null,
};

describe("currentStock — basic", () => {
  it("returns 0 when no transactions", () => {
    expect(currentStock([], [onceDaily], d(2026, 1, 10))).toBe(0);
  });

  it("restock only, no days elapsed yet (same day as restock)", () => {
    const txns: StockTx[] = [
      { type: "restock", quantity: 30, occurredAt: d(2026, 1, 1) },
    ];
    // start = day0, asOf = day0; half-open [day0, day0) = 0 days → consumption = 0
    expect(currentStock(txns, [onceDaily], d(2026, 1, 1))).toBe(30);
  });

  it("restock minus scheduled consumption over N days", () => {
    const txns: StockTx[] = [
      { type: "restock", quantity: 30, occurredAt: d(2026, 1, 1) },
    ];
    // [day1, day11) = 10 days consumed
    expect(currentStock(txns, [onceDaily], d(2026, 1, 11))).toBe(20);
  });

  it("ignores transactions after asOf", () => {
    const txns: StockTx[] = [
      { type: "restock", quantity: 30, occurredAt: d(2026, 1, 1) },
      { type: "restock", quantity: 100, occurredAt: d(2026, 2, 1) }, // future
    ];
    expect(currentStock(txns, [onceDaily], d(2026, 1, 11))).toBe(20);
  });
});

describe("currentStock — worked example (MUST yield 15)", () => {
  /**
   * Day0 = 2026-01-01
   * Schedule: 1 unit/day, effectiveFrom day0, open-ended
   *
   * Event 1: restock +30 on day0
   * At day5 (2026-01-06): computed stock = 30 - 5 = 25
   *   counted = 20, so adjustment delta = 20 - 25 = -5
   * Event 2: adjustment -5 on day5
   *
   * At day10 (2026-01-11):
   *   deltas = 30 + (-5) = 25
   *   consumption over [day0, day10) = 10 days × 1 = 10
   *   result = 25 - 10 = 15
   */
  const day0 = d(2026, 1, 1);
  const day5 = d(2026, 1, 6);
  const day10 = d(2026, 1, 11);

  const txns: StockTx[] = [
    { type: "restock", quantity: 30, occurredAt: day0 },
    { type: "adjustment", quantity: -5, occurredAt: day5 },
  ];

  it("at day0 (no days elapsed): 30 - 0 = 30", () => {
    expect(currentStock(txns, [onceDaily], day0)).toBe(30);
  });

  it("at day5 with only the restock (before adjustment): 30 - 5 = 25", () => {
    const restockOnly: StockTx[] = [
      { type: "restock", quantity: 30, occurredAt: day0 },
    ];
    expect(currentStock(restockOnly, [onceDaily], day5)).toBe(25);
  });

  it("at day10 with both restock + adjustment: must equal 15", () => {
    expect(currentStock(txns, [onceDaily], day10)).toBe(15);
  });

  it("at day5 with both txns: deltas=25, consumption=[day0,day5)=5 days → 25-5=20", () => {
    expect(currentStock(txns, [onceDaily], day5)).toBe(20);
  });
});

describe("currentStock — multi-schedule horizon", () => {
  /**
   * Day0–Day9: 1 dose/day (onceDaily)
   * Day10+:    2 doses/day (twiceDaily)
   * Restock +60 on day0
   * Check at day15: consumption = 10*1 + 5*2 = 10 + 10 = 20 → 60-20 = 40
   */
  const day0 = d(2026, 1, 1);
  const day10 = d(2026, 1, 11);
  const day15 = d(2026, 1, 16);

  const once: Schedule = {
    doseTimes: ["08:00"],
    unitsPerDose: 1,
    effectiveFrom: day0,
    effectiveTo: day10,
  };
  const twice: Schedule = {
    doseTimes: ["08:00", "20:00"],
    unitsPerDose: 1,
    effectiveFrom: day10,
    effectiveTo: null,
  };

  it("correctly blends two schedules over a 15-day horizon", () => {
    const txns: StockTx[] = [
      { type: "restock", quantity: 60, occurredAt: day0 },
    ];
    // [day0, day15) = days 0..14 (15 days)
    // days 0-9 under once (10 days × 1 = 10)
    // days 10-14 under twice (5 days × 2 = 10)
    // total consumption = 20
    expect(currentStock(txns, [once, twice], day15)).toBe(40);
  });
});

describe("currentStock — negative-going stock", () => {
  it("allows stock to go negative without clamping", () => {
    const txns: StockTx[] = [
      { type: "restock", quantity: 5, occurredAt: d(2026, 1, 1) },
    ];
    // 5 - 20 days = -15
    expect(currentStock(txns, [onceDaily], d(2026, 1, 21))).toBe(-15);
  });
});

describe("daysRemaining", () => {
  it("returns floor of stock / dailyConsumption", () => {
    expect(daysRemaining(20, 1)).toBe(20);
  });

  it("floors fractional result", () => {
    expect(daysRemaining(7, 2)).toBe(3);
  });

  it("returns null when dailyConsumption is 0", () => {
    expect(daysRemaining(100, 0)).toBeNull();
  });

  it("clamps to 0 for negative stock", () => {
    expect(daysRemaining(-5, 1)).toBe(0);
  });

  it("returns 0 for zero stock", () => {
    expect(daysRemaining(0, 1)).toBe(0);
  });

  it("handles fractional stock", () => {
    expect(daysRemaining(2.9, 1)).toBe(2);
  });
});

describe("reorderByDate", () => {
  it("returns runOut minus leadTimeDays", () => {
    const asOf = d(2026, 1, 1);
    // runOut = day1 + 20 days = day21 (2026-01-21)
    // reorder = day21 - 7 = 2026-01-14
    const result = reorderByDate(asOf, 20, 7);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // Jan
    expect(result.getDate()).toBe(14);
  });

  it("crosses month boundaries correctly", () => {
    const asOf = d(2026, 1, 25);
    // runOut = 2026-01-25 + 10 = 2026-02-04
    // reorder = 2026-02-04 - 3 = 2026-02-01
    const result = reorderByDate(asOf, 10, 3);
    expect(result.getMonth()).toBe(1); // Feb
    expect(result.getDate()).toBe(1);
  });
});

describe("stockStatus", () => {
  it("returns 'ok' when daysRemaining is null (no consumption)", () => {
    expect(stockStatus(null, 7)).toBe("ok");
  });

  it("returns 'urgent' when daysRemaining <= leadTimeDays", () => {
    expect(stockStatus(3, 7)).toBe("urgent");
    expect(stockStatus(7, 7)).toBe("urgent");
  });

  it("returns 'reorder' when daysRemaining <= leadTimeDays + bufferDays", () => {
    expect(stockStatus(10, 7)).toBe("reorder");
    expect(stockStatus(14, 7)).toBe("reorder");
  });

  it("returns 'ok' when daysRemaining > leadTimeDays + bufferDays", () => {
    expect(stockStatus(30, 7)).toBe("ok");
    expect(stockStatus(15, 7)).toBe("ok");
  });

  it("respects custom bufferDays", () => {
    expect(stockStatus(12, 7, 3)).toBe("ok"); // 12 > 7+3=10 → ok
    expect(stockStatus(10, 7, 3)).toBe("reorder"); // 10 == 7+3=10 → reorder
  });
});
