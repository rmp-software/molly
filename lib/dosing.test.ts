import { describe, it, expect } from "vitest";
import { mgPerKg } from "./dosing";

describe("mgPerKg", () => {
  it("computes mg/kg correctly", () => {
    // (2 * 97.5) / 29.4 ≈ 6.6326...
    expect(mgPerKg(2, 97.5, 29.4)).toBeCloseTo(6.6326, 3);
  });

  it("returns null when strengthMg is null", () => {
    expect(mgPerKg(2, null, 29.4)).toBeNull();
  });

  it("returns null when strengthMg is undefined", () => {
    expect(mgPerKg(2, undefined, 29.4)).toBeNull();
  });

  it("returns null when weightKg is null", () => {
    expect(mgPerKg(2, 97.5, null)).toBeNull();
  });

  it("returns null when weightKg is undefined", () => {
    expect(mgPerKg(2, 97.5, undefined)).toBeNull();
  });

  it("returns null when weightKg is zero", () => {
    expect(mgPerKg(2, 97.5, 0)).toBeNull();
  });

  it("returns null when strengthMg is zero", () => {
    // Zero strength is still a defined input but yields 0 mg/kg;
    // the spec says null if strengthMg is missing/zero, so return null
    expect(mgPerKg(2, 0, 29.4)).toBeNull();
  });

  it("returns null when unitsPerDay is zero", () => {
    expect(mgPerKg(0, 97.5, 29.4)).toBeNull();
  });

  it("returns null when unitsPerDay is negative", () => {
    expect(mgPerKg(-1, 97.5, 29.4)).toBeNull();
  });

  it("returns null when strengthMg is NaN", () => {
    expect(mgPerKg(2, NaN, 29.4)).toBeNull();
  });

  it("returns null when weightKg is NaN", () => {
    expect(mgPerKg(2, 97.5, NaN)).toBeNull();
  });

  it("returns raw number (not pre-rounded)", () => {
    const result = mgPerKg(2, 97.5, 29.4);
    // raw value should have decimals
    expect(result).not.toBeNull();
    expect(result! % 1).not.toBe(0);
  });

  it("works with single unit per day", () => {
    // (1 * 100) / 50 = 2.0
    expect(mgPerKg(1, 100, 50)).toBeCloseTo(2.0, 5);
  });
});
