import { describe, it, expect } from "vitest";
import { fmtNum, fmtKg, fmtDuration, fmtDateTimePt, fmtShortDate } from "./format";

describe("fmtNum", () => {
  it("formats decimal with comma", () => {
    expect(fmtNum(28.5)).toBe("28,5");
  });

  it("whole number shows no decimals", () => {
    expect(fmtNum(30)).toBe("30");
  });

  it("decimal comma separator", () => {
    expect(fmtNum(1.1)).toBe("1,1");
  });

  it("whole float shows no decimals", () => {
    expect(fmtNum(2.0)).toBe("2");
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

  it("NaN returns 0", () => {
    expect(fmtNum(NaN)).toBe("0");
  });

  it("Infinity returns 0", () => {
    expect(fmtNum(Infinity)).toBe("0");
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

  it("NaN kg returns 0 kg", () => {
    expect(fmtKg(NaN)).toBe("0 kg");
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

  it("formats date and time in pt-BR with Sao Paulo timezone", () => {
    expect(fmtDateTimePt(d)).toBe("15/03/2024, 09:00");
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
