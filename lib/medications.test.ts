import { describe, it, expect } from "vitest";
import { wasActiveDuring, type MedActivityWindow } from "./medications";

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

// The report range used across most cases: 2026-01-01 .. 2026-06-30
const FROM = d(2026, 1, 1);
const TO = d(2026, 6, 30);

describe("wasActiveDuring", () => {
  it("returns true for an active-now med whose window overlaps the range", () => {
    const med: MedActivityWindow = {
      createdAt: d(2026, 2, 1),
      archivedAt: null,
      isActive: true,
      schedules: [{ effectiveFrom: d(2026, 2, 1), effectiveTo: null }],
    };
    expect(wasActiveDuring(med, FROM, TO)).toBe(true);
  });

  it("returns true for a med created before the range and still active (open-ended overlap)", () => {
    const med: MedActivityWindow = {
      createdAt: d(2025, 1, 1),
      archivedAt: null,
      isActive: true,
      schedules: [{ effectiveFrom: d(2025, 1, 1), effectiveTo: null }],
    };
    expect(wasActiveDuring(med, FROM, TO)).toBe(true);
  });

  it("returns false for an active-now med created entirely after the range (windowStart > to)", () => {
    const med: MedActivityWindow = {
      createdAt: d(2026, 8, 1),
      archivedAt: null,
      isActive: true,
      schedules: [{ effectiveFrom: d(2026, 8, 1), effectiveTo: null }],
    };
    expect(wasActiveDuring(med, FROM, TO)).toBe(false);
  });

  it("returns true for an archived med whose active window overlaps mid-range", () => {
    const med: MedActivityWindow = {
      createdAt: d(2025, 12, 1),
      archivedAt: d(2026, 3, 15),
      isActive: false,
      schedules: [{ effectiveFrom: d(2025, 12, 1), effectiveTo: d(2026, 3, 15) }],
    };
    expect(wasActiveDuring(med, FROM, TO)).toBe(true);
  });

  it("returns false for a med archived entirely before the range (windowEnd < from)", () => {
    const med: MedActivityWindow = {
      createdAt: d(2025, 1, 1),
      archivedAt: d(2025, 6, 1),
      isActive: false,
      schedules: [{ effectiveFrom: d(2025, 1, 1), effectiveTo: d(2025, 6, 1) }],
    };
    expect(wasActiveDuring(med, FROM, TO)).toBe(false);
  });

  it("returns true for a never-archived med active across the whole range", () => {
    const med: MedActivityWindow = {
      createdAt: d(2024, 1, 1),
      archivedAt: null,
      isActive: true,
      schedules: [{ effectiveFrom: d(2024, 1, 1), effectiveTo: null }],
    };
    expect(wasActiveDuring(med, FROM, TO)).toBe(true);
  });

  describe("no schedules — window driven by createdAt / archivedAt", () => {
    it("returns true for an active med with no schedules created within the range", () => {
      const med: MedActivityWindow = {
        createdAt: d(2026, 3, 1),
        archivedAt: null,
        isActive: true,
        schedules: [],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });

    it("returns false for an active med with no schedules created after the range", () => {
      const med: MedActivityWindow = {
        createdAt: d(2026, 9, 1),
        archivedAt: null,
        isActive: true,
        schedules: [],
      };
      // created after to → windowStart > to → false
      expect(wasActiveDuring(med, FROM, TO)).toBe(false);
    });

    it("uses archivedAt as windowEnd when no schedules exist (archived before range → false)", () => {
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: d(2025, 6, 1),
        isActive: false,
        schedules: [],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(false);
    });

    it("falls back to createdAt as windowEnd when archived but archivedAt is null and no schedules (single-instant before range → false)", () => {
      const med: MedActivityWindow = {
        createdAt: d(2025, 6, 1),
        archivedAt: null,
        isActive: false, // archived but no archivedAt and no schedules
        schedules: [],
      };
      // windowEnd falls back to createdAt = 2025-06-01 < from → false
      expect(wasActiveDuring(med, FROM, TO)).toBe(false);
    });

    it("falls back to createdAt as windowEnd when archived without archivedAt and createdAt is in range → true", () => {
      const med: MedActivityWindow = {
        createdAt: d(2026, 3, 1),
        archivedAt: null,
        isActive: false,
        schedules: [],
      };
      // windowStart = windowEnd = createdAt = 2026-03-01, inside [from,to] → true
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });
  });

  describe("inclusive boundary cases", () => {
    it("returns true when archivedAt is exactly == from (inclusive)", () => {
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: d(2026, 1, 1), // == FROM
        isActive: false,
        schedules: [{ effectiveFrom: d(2025, 1, 1), effectiveTo: d(2026, 1, 1) }],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });

    it("returns false when archivedAt is exactly one day before from", () => {
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: d(2025, 12, 31), // one day before FROM (2026-01-01)
        isActive: false,
        schedules: [
          { effectiveFrom: d(2025, 1, 1), effectiveTo: d(2025, 12, 31) },
        ],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(false);
    });

    it("returns true for a med created exactly == to (inclusive)", () => {
      const med: MedActivityWindow = {
        createdAt: TO, // 2026-06-30
        archivedAt: null,
        isActive: true,
        schedules: [{ effectiveFrom: TO, effectiveTo: null }],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });

    it("returns false for a med created the day after to", () => {
      const med: MedActivityWindow = {
        createdAt: d(2026, 7, 1), // one day after TO
        archivedAt: null,
        isActive: true,
        schedules: [{ effectiveFrom: d(2026, 7, 1), effectiveTo: null }],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(false);
    });

    it("compares by timestamp, not reference (distinct Date objects, same instant, archivedAt==from → true)", () => {
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: dt(2026, 1, 1, 0, 0), // same instant as FROM, different object
        isActive: false,
        schedules: [],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });
  });

  describe("multiple schedules", () => {
    it("uses min(effectiveFrom) as windowStart", () => {
      // Earliest schedule starts before the range; later schedule is mid-range.
      // Med is active, so windowEnd is open-ended. windowStart = earliest = 2025-11-01.
      const med: MedActivityWindow = {
        createdAt: d(2025, 11, 1),
        archivedAt: null,
        isActive: true,
        schedules: [
          { effectiveFrom: d(2026, 2, 1), effectiveTo: null },
          { effectiveFrom: d(2025, 11, 1), effectiveTo: d(2026, 2, 1) },
        ],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });

    it("uses max(effectiveTo) as windowEnd fallback when archived without archivedAt", () => {
      // Archived, archivedAt null → windowEnd = max(effectiveTo) = 2025-12-01,
      // which is before from (2026-01-01) → false.
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: null,
        isActive: false,
        schedules: [
          { effectiveFrom: d(2025, 1, 1), effectiveTo: d(2025, 6, 1) },
          { effectiveFrom: d(2025, 6, 1), effectiveTo: d(2025, 12, 1) },
        ],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(false);
    });

    it("max(effectiveTo) fallback that lands inside the range → true", () => {
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: null,
        isActive: false,
        schedules: [
          { effectiveFrom: d(2025, 1, 1), effectiveTo: d(2025, 6, 1) },
          { effectiveFrom: d(2025, 6, 1), effectiveTo: d(2026, 3, 1) },
        ],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });

    it("prefers archivedAt over max(effectiveTo) when archivedAt is set", () => {
      // archivedAt (2026-02-01) overlaps the range even though max(effectiveTo)
      // would be 2025-12-01 (before range). archivedAt must win → true.
      const med: MedActivityWindow = {
        createdAt: d(2025, 1, 1),
        archivedAt: d(2026, 2, 1),
        isActive: false,
        schedules: [
          { effectiveFrom: d(2025, 1, 1), effectiveTo: d(2025, 6, 1) },
          { effectiveFrom: d(2025, 6, 1), effectiveTo: d(2025, 12, 1) },
        ],
      };
      expect(wasActiveDuring(med, FROM, TO)).toBe(true);
    });
  });
});
