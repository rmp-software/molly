/**
 * TDD tests for buildDoseIcs – write failing first, implement after.
 */

import { describe, it, expect } from "vitest";
import { buildDoseIcs } from "./ics";

// Fixed reference date: 2026-06-07 00:00 local (Sun)
const FROM = new Date(2026, 5, 7); // June 7 2026 local midnight

describe("buildDoseIcs", () => {
  it("wraps output in BEGIN:VCALENDAR / END:VCALENDAR", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("includes required header properties", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Molly//Doses//PT-BR");
    expect(ics).toContain("CALSCALE:GREGORIAN");
  });

  it("produces exactly one VEVENT for a single dose time", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    const beginCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    const endCount = (ics.match(/END:VEVENT/g) ?? []).length;
    expect(beginCount).toBe(1);
    expect(endCount).toBe(1);
  });

  it("produces exactly two VEVENTs for two dose times", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00", "20:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    const beginCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(beginCount).toBe(2);
  });

  it("DTSTART is floating local time with correct HHMMSS for 08:00", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    // Floating = no 'Z', no TZID; date is 20260607, time is 080000
    expect(ics).toContain("DTSTART:20260607T080000");
    // Must NOT have trailing Z on DTSTART
    expect(ics).not.toMatch(/DTSTART:20260607T080000Z/);
  });

  it("DTSTART for 20:00 dose time is correct", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00", "20:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    expect(ics).toContain("DTSTART:20260607T200000");
  });

  it("each VEVENT has RRULE:FREQ=DAILY", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00", "20:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    const rruleCount = (ics.match(/RRULE:FREQ=DAILY/g) ?? []).length;
    expect(rruleCount).toBe(2);
  });

  it("uses CRLF line endings throughout", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    // Every line should end with \r\n
    const lines = ics.split("\r\n");
    // Last element after splitting is empty string (trailing \r\n)
    expect(lines[lines.length - 1]).toBe("");
    // No bare \n without preceding \r
    expect(ics).not.toMatch(/(?<!\r)\n/);
  });

  it("SUMMARY escapes commas in med name", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital, 100mg",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    // Comma must be escaped as \,
    expect(ics).toContain("SUMMARY:Fenobarbital\\, 100mg");
  });

  it("SUMMARY escapes semicolons in med name", () => {
    const ics = buildDoseIcs({
      medName: "Med; extra",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    expect(ics).toContain("SUMMARY:Med\\; extra");
  });

  it("UIDs are stable — same inputs produce same output", () => {
    const opts = {
      medName: "Fenobarbital",
      doseTimes: ["08:00", "20:00"],
      from: FROM,
      uidSeed: "med-abc",
    };
    const first = buildDoseIcs(opts);
    const second = buildDoseIcs(opts);
    expect(first).toBe(second);
  });

  it("UIDs are distinct per dose time", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00", "20:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    expect(ics).toContain("UID:med-abc-0800@molly");
    expect(ics).toContain("UID:med-abc-2000@molly");
  });

  it("DTSTAMP is derived from `from` at 000000Z (deterministic)", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    // FROM is June 7 2026; local midnight → UTC year/month/day used for stamp
    expect(ics).toContain("DTSTAMP:20260607T000000Z");
  });

  it("includes DURATION:PT15M", () => {
    const ics = buildDoseIcs({
      medName: "Fenobarbital",
      doseTimes: ["08:00"],
      from: FROM,
      uidSeed: "med-abc",
    });
    expect(ics).toContain("DURATION:PT15M");
  });
});
