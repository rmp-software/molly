import { describe, it, expect } from "vitest";
import { fmtNum, fmtKg, fmtDuration, fmtDateTimePt, fmtShortDate } from "./format";

describe("fmtNum", () => {
  it("formats decimal with comma", () => {
    expect(fmtNum(28.5)).toBe("28,5");
  });

  it("whole number shows no decimals", () => {
    expect(fmtNum(30)).toBe("30");
  });

  it("trailing zero is stripped", () => {
    expect(fmtNum(28.5)).toBe("28,5"); // 28.50 === 28.5
  });

  it("zero is formatted as 0", () => {
    expect(fmtNum(0)).toBe("0");
  });

  it("large number uses pt-BR thousands separator", () => {
    expect(fmtNum(1234.5)).toBe("1.234,5");
  });

  it("large whole number uses thousands separator", () => {
    expect(fmtNum(10000)).toBe("10.000");
  });

  it("caps at 2 decimal places", () => {
    expect(fmtNum(1.123)).toBe("1,12");
  });

  it("negative number", () => {
    expect(fmtNum(-5.5)).toBe("-5,5");
  });
});

describe("fmtKg", () => {
  it("formats with kg suffix", () => {
    expect(fmtKg(29.4)).toBe("29,4 kg");
  });

  it("whole number kg", () => {
    expect(fmtKg(30)).toBe("30 kg");
  });

  it("zero kg", () => {
    expect(fmtKg(0)).toBe("0 kg");
  });
});

describe("fmtDuration", () => {
  it("displays seconds only when under 60", () => {
    expect(fmtDuration(55)).toBe("55s");
  });

  it("displays min and seconds", () => {
    expect(fmtDuration(95)).toBe("1min 35s");
  });

  it("exactly 2 minutes shows 2min 0s", () => {
    expect(fmtDuration(120)).toBe("2min 0s");
  });

  it("zero seconds", () => {
    expect(fmtDuration(0)).toBe("0s");
  });

  it("negative seconds returns 0s", () => {
    expect(fmtDuration(-10)).toBe("0s");
  });

  it("NaN returns 0s", () => {
    expect(fmtDuration(NaN)).toBe("0s");
  });

  it("exactly 60 seconds is 1min 0s", () => {
    expect(fmtDuration(60)).toBe("1min 0s");
  });
});

describe("fmtDateTimePt", () => {
  // Uses timeZone: "America/Sao_Paulo" so output is stable regardless of local TZ.
  // 2024-03-15T12:00:00Z = 09:00 in Sao Paulo (UTC-3)
  const d = new Date("2024-03-15T12:00:00Z");

  it("contains day/month/year in pt-BR format", () => {
    const result = fmtDateTimePt(d);
    // pt-BR date format: 15/03/2024
    expect(result).toContain("15/03/2024");
  });

  it("contains time 09:00 (Sao Paulo UTC-3)", () => {
    const result = fmtDateTimePt(d);
    expect(result).toContain("09:00");
  });
});

describe("fmtShortDate", () => {
  it("formats as dd/mm", () => {
    const d = new Date("2024-03-15T12:00:00Z");
    // Uses America/Sao_Paulo: 2024-03-15T09:00 → 15/03
    expect(fmtShortDate(d)).toBe("15/03");
  });

  it("pads single digit day and month", () => {
    const d = new Date("2024-01-05T12:00:00Z");
    expect(fmtShortDate(d)).toBe("05/01");
  });
});
