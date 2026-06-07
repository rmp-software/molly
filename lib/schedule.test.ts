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

  describe("tiebreak determinism (Fix 2)", () => {
    /**
     * Regression: when two schedules share the same effectiveFrom, the result
     * must not depend on array order. The open-ended schedule (effectiveTo=null)
     * must always win over one with a set effectiveTo.
     */
    const sameFrom = d(2026, 3, 1);
    const queryDate = d(2026, 5, 1);

    const sClosed: Schedule = {
      doseTimes: ["08:00"],
      unitsPerDose: 1,
      effectiveFrom: sameFrom,
      effectiveTo: d(2027, 1, 1), // has an end date
    };
    const sOpen: Schedule = {
      doseTimes: ["08:00", "20:00"],
      unitsPerDose: 2,
      effectiveFrom: sameFrom,
      effectiveTo: null, // open-ended — should win
    };

    it("returns the open-ended schedule when [closed, open] order", () => {
      expect(activeScheduleOn([sClosed, sOpen], queryDate)).toBe(sOpen);
    });

    it("returns the open-ended schedule when [open, closed] order", () => {
      expect(activeScheduleOn([sOpen, sClosed], queryDate)).toBe(sOpen);
    });
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

  describe("non-zero-padded dose times (Fix 3)", () => {
    /**
     * Regression: doseTimes like "8:00" must be sorted numerically (by parsed
     * minutes), not lexicographically. Lexicographic sort puts "8:00" AFTER
     * "14:00" and "20:00" (because '8' > '2' > '1'), which means when rolling
     * over to tomorrow, sorted[0] would return "14:00" instead of the correct
     * first dose "8:00".
     *
     * Reproducer for the tomorrow-rollover path:
     *   doseTimes=["8:00","14:00","20:00"], now=21:00 (after all doses) →
     *   must return "8:00" for tomorrow (not "14:00").
     *
     * Reproducer for the today path:
     *   doseTimes=["8:00","14:00","20:00"], now=08:30 → must return "14:00"
     *   today (not roll over to tomorrow due to "8:00" being sorted last).
     */
    const sUnpadded: Schedule = {
      doseTimes: ["8:00", "14:00", "20:00"],
      unitsPerDose: 1,
      effectiveFrom: d(2026, 1, 1),
      effectiveTo: null,
    };

    it('picks "14:00" today when now is 08:30 and doseTimes use "8:00" (unpadded)', () => {
      const now = dt(2026, 6, 7, 8, 30); // 08:30 → next should be 14:00
      const result = nextDose([sUnpadded], now);
      expect(result).not.toBeNull();
      expect(result!.time).toBe("14:00");
      expect(result!.at > now).toBe(true);
    });

    it('rolls over to "8:00" tomorrow (not "14:00") when doseTimes are unpadded and all doses passed today', () => {
      const now = dt(2026, 6, 7, 21, 0); // 21:00 → after all doses today
      const result = nextDose([sUnpadded], now);
      expect(result).not.toBeNull();
      // lexicographic sort puts "14:00" first, so without the fix this would return "14:00"
      expect(result!.time).toBe("8:00");
      expect(result!.at.getDate()).toBe(8); // tomorrow
    });

    it("zero-padded times still work correctly after the fix", () => {
      const now = dt(2026, 6, 7, 10, 0); // 10:00 → next is 14:00
      const result = nextDose([s], now);
      expect(result).not.toBeNull();
      expect(result!.time).toBe("14:00");
    });
  });
});
