import { describe, it, expect } from "vitest";
import { dbDateToLocalMidnight, dbDateToLocalMidnightNullable } from "./dates";

describe("dbDateToLocalMidnight", () => {
  it("maps a UTC-midnight Date to local June 7 2026 regardless of host TZ", () => {
    const utcMidnight = new Date("2026-06-07T00:00:00.000Z");
    const local = dbDateToLocalMidnight(utcMidnight);
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(5); // 0-indexed, so 5 = June
    expect(local.getDate()).toBe(7);
  });

  it("accepts a string and maps it to the correct local date", () => {
    const local = dbDateToLocalMidnight("2026-06-07T00:00:00.000Z");
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(5);
    expect(local.getDate()).toBe(7);
  });

  it("local midnight has time components 0", () => {
    const local = dbDateToLocalMidnight(new Date("2026-01-15T00:00:00.000Z"));
    expect(local.getHours()).toBe(0);
    expect(local.getMinutes()).toBe(0);
    expect(local.getSeconds()).toBe(0);
    expect(local.getMilliseconds()).toBe(0);
  });

  it("handles end-of-month dates correctly", () => {
    const local = dbDateToLocalMidnight(new Date("2026-12-31T00:00:00.000Z"));
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(11); // December
    expect(local.getDate()).toBe(31);
  });
});

describe("dbDateToLocalMidnightNullable", () => {
  it("returns null for null input", () => {
    expect(dbDateToLocalMidnightNullable(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(dbDateToLocalMidnightNullable(undefined)).toBeNull();
  });

  it("maps a Date to local midnight when non-null", () => {
    const local = dbDateToLocalMidnightNullable(new Date("2026-06-07T00:00:00.000Z"));
    expect(local).not.toBeNull();
    expect(local!.getFullYear()).toBe(2026);
    expect(local!.getMonth()).toBe(5);
    expect(local!.getDate()).toBe(7);
  });
});
