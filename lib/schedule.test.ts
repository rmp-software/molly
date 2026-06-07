import { describe, it, expect } from "vitest";
import {
  dailyConsumption,
  activeScheduleOn,
  nextDose,
  type Schedule,
} from "./schedule";

// Helper: build a date at midnight local time
const d = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

// Helper: build a datetime at local time
const dt = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) => new Date(year, month - 1, day, hour, minute, 0, 0);

describe("dailyConsumption", () => {
  it("multiplies dose count by units per dose", () => {
    const s: Schedule = {
      doseTimes: ["08:00", "20:00"],
      unitsPerDose: 2,
      effectiveFrom: d(2026, 1, 1),
      effectiveTo: null,
    };
    expect(dailyConsumption(s)).toBe(4);
  });

  it("returns 0 for no dose times", () => {
    const s: Schedule = {
      doseTimes: [],
      unitsPerDose: 2,
      effectiveFrom: d(2026, 1, 1),
      effectiveTo: null,
    };
    expect(dailyConsumption(s)).toBe(0);
  });

  it("works with a single dose time", () => {
    const s: Schedule = {
      doseTimes: ["08:00"],
      unitsPerDose: 1,
      effectiveFrom: d(2026, 1, 1),
      effectiveTo: null,
    };
    expect(dailyConsumption(s)).toBe(1);
  });

  it("works with fractional units per dose", () => {
    const s: Schedule = {
      doseTimes: ["08:00", "20:00"],
      unitsPerDose: 0.5,
      effectiveFrom: d(2026, 1, 1),
      effectiveTo: null,
    };
    expect(dailyConsumption(s)).toBeCloseTo(1.0);
  });
});

describe("activeScheduleOn", () => {
  const s1: Schedule = {
    doseTimes: ["08:00"],
    unitsPerDose: 1,
    effectiveFrom: d(2026, 1, 1),
    effectiveTo: d(2026, 6, 1),
  };
  const s2: Schedule = {
    doseTimes: ["08:00", "20:00"],
    unitsPerDose: 2,
    effectiveFrom: d(2026, 6, 1),
    effectiveTo: null,
  };

  it("returns null for empty schedules", () => {
    expect(activeScheduleOn([], d(2026, 3, 1))).toBeNull();
  });

  it("returns a schedule active on a date within its closed range", () => {
    expect(activeScheduleOn([s1], d(2026, 3, 15))).toBe(s1);
  });

  it("includes date equal to effectiveFrom (closed start)", () => {
    expect(activeScheduleOn([s1], d(2026, 1, 1))).toBe(s1);
  });

  it("excludes date equal to effectiveTo (open end)", () => {
    // s1 ends at 2026-06-01 (exclusive), s2 starts on 2026-06-01 (inclusive)
    expect(activeScheduleOn([s1, s2], d(2026, 6, 1))).toBe(s2);
  });

  it("returns open-ended schedule for a future date", () => {
    expect(activeScheduleOn([s1, s2], d(2027, 1, 1))).toBe(s2);
  });

  it("returns null for a date before all schedules", () => {
    expect(activeScheduleOn([s1, s2], d(2025, 12, 31))).toBeNull();
  });

  it("returns the schedule with the latest effectiveFrom when multiple match", () => {
    // overlapping schedules — pick the one with the latest effectiveFrom
    const older: Schedule = {
      doseTimes: ["07:00"],
      unitsPerDose: 1,
      effectiveFrom: d(2026, 1, 1),
      effectiveTo: null,
    };
    const newer: Schedule = {
      doseTimes: ["09:00"],
      unitsPerDose: 2,
      effectiveFrom: d(2026, 3, 1),
      effectiveTo: null,
    };
    expect(activeScheduleOn([older, newer], d(2026, 5, 1))).toBe(newer);
  });

  it("date comparison ignores time portion", () => {
    // s1 effectiveFrom = 2026-01-01; query at 2026-01-01 23:59 should still match
    expect(activeScheduleOn([s1], dt(2026, 1, 1, 23, 59))).toBe(s1);
  });
});

describe("nextDose", () => {
  const s: Schedule = {
    doseTimes: ["08:00", "14:00", "20:00"],
    unitsPerDose: 1,
    effectiveFrom: d(2026, 1, 1),
    effectiveTo: null,
  };

  it("returns null when no schedules provided", () => {
    expect(nextDose([], dt(2026, 6, 1, 9, 0))).toBeNull();
  });

  it("returns null when no schedule active on current date", () => {
    const future: Schedule = {
      doseTimes: ["08:00"],
      unitsPerDose: 1,
      effectiveFrom: d(2030, 1, 1),
      effectiveTo: null,
    };
    expect(nextDose([future], dt(2026, 6, 1, 9, 0))).toBeNull();
  });

  it("picks the earliest dose time strictly after now (today)", () => {
    const now = dt(2026, 6, 7, 10, 0); // 10:00 → next is 14:00
    const result = nextDose([s], now);
    expect(result).not.toBeNull();
    expect(result!.time).toBe("14:00");
    expect(result!.at > now).toBe(true);
  });

  it("picks the first dose time (08:00) when now is before all doses", () => {
    const now = dt(2026, 6, 7, 7, 0); // 07:00 → next is 08:00 today
    const result = nextDose([s], now);
    expect(result).not.toBeNull();
    expect(result!.time).toBe("08:00");
    expect(result!.at > now).toBe(true);
  });

  it("rolls over to tomorrow when now is after all doses today", () => {
    const now = dt(2026, 6, 7, 21, 0); // 21:00 → after 20:00 last dose
    const result = nextDose([s], now);
    expect(result).not.toBeNull();
    expect(result!.time).toBe("08:00"); // earliest dose
    expect(result!.at > now).toBe(true);
    // should be tomorrow
    expect(result!.at.getDate()).toBe(8);
    expect(result!.at.getMonth()).toBe(5); // June = 5
  });

  it("rolls over across a month boundary", () => {
    const now = dt(2026, 6, 30, 21, 0); // last day of June after last dose
    const result = nextDose([s], now);
    expect(result).not.toBeNull();
    expect(result!.at.getDate()).toBe(1);
    expect(result!.at.getMonth()).toBe(6); // July = 6
  });

  it("picks exactly the last dose if now is exactly on an earlier dose time", () => {
    // now = exactly 08:00 → 08:00 is NOT strictly after, so next is 14:00
    const now = dt(2026, 6, 7, 8, 0);
    const result = nextDose([s], now);
    expect(result).not.toBeNull();
    expect(result!.time).toBe("14:00");
  });
});
