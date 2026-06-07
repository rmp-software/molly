import { describe, it, expect } from "vitest";
import { buildDigest } from "./email";

// ─── helpers ────────────────────────────────────────────────────────────────

type MedInput = Parameters<typeof buildDigest>[0][number];

const ok = (name: string): MedInput => ({
  name,
  status: "ok",
  daysRemaining: 30,
  reorderByDate: "2026-07-07",
});

const reorder = (name: string, days = 8, date = "2026-06-15"): MedInput => ({
  name,
  status: "reorder",
  daysRemaining: days,
  reorderByDate: date,
});

const urgent = (name: string, days = 2, date = "2026-06-09"): MedInput => ({
  name,
  status: "urgent",
  daysRemaining: days,
  reorderByDate: date,
});

// ─── buildDigest ─────────────────────────────────────────────────────────────

describe("buildDigest — null cases", () => {
  it("returns null for empty array", () => {
    expect(buildDigest([])).toBeNull();
  });

  it("returns null when all meds are ok", () => {
    expect(buildDigest([ok("Fenobarbital"), ok("KBr")])).toBeNull();
  });
});

describe("buildDigest — non-null cases", () => {
  it("returns non-null when at least one med is urgent", () => {
    const result = buildDigest([ok("Pred"), urgent("Fenobarbital")]);
    expect(result).not.toBeNull();
  });

  it("returns non-null when at least one med is reorder", () => {
    const result = buildDigest([ok("Pred"), reorder("KBr")]);
    expect(result).not.toBeNull();
  });

  it("body contains the name of urgent med", () => {
    const result = buildDigest([urgent("Fenobarbital")]);
    expect(result!.body).toContain("Fenobarbital");
  });

  it("body contains the name of reorder med", () => {
    const result = buildDigest([reorder("KBr")]);
    expect(result!.body).toContain("KBr");
  });

  it("body excludes ok meds", () => {
    const result = buildDigest([ok("Prednisona"), urgent("Fenobarbital")]);
    expect(result!.body).not.toContain("Prednisona");
  });

  it("body contains the reorderByDate (pt-BR dd/mm/aaaa)", () => {
    // urgent with date 2026-06-09 → 09/06/2026
    const result = buildDigest([urgent("Feno", 2, "2026-06-09")]);
    expect(result!.body).toContain("09/06/2026");
  });

  it("body contains reorderByDate for reorder med", () => {
    // reorder with date 2026-06-15 → 15/06/2026
    const result = buildDigest([reorder("KBr", 8, "2026-06-15")]);
    expect(result!.body).toContain("15/06/2026");
  });

  it("urgent meds appear before reorder meds in body", () => {
    const result = buildDigest([reorder("KBr"), urgent("Fenobarbital")]);
    expect(result).not.toBeNull();
    const urgentIdx = result!.body.indexOf("Fenobarbital");
    const reorderIdx = result!.body.indexOf("KBr");
    expect(urgentIdx).toBeGreaterThanOrEqual(0);
    expect(reorderIdx).toBeGreaterThanOrEqual(0);
    expect(urgentIdx).toBeLessThan(reorderIdx);
  });

  it("body contains daysRemaining for urgent med", () => {
    const result = buildDigest([urgent("Feno", 2, "2026-06-09")]);
    expect(result!.body).toContain("2");
  });

  it("body contains daysRemaining for reorder med", () => {
    const result = buildDigest([reorder("KBr", 8, "2026-06-15")]);
    expect(result!.body).toContain("8");
  });
});

describe("buildDigest — subject pluralization", () => {
  it('uses "1 remédio" for exactly one amber/red med', () => {
    const result = buildDigest([urgent("Feno")]);
    expect(result!.subject).toContain("1 remédio");
  });

  it('uses "2 remédios" for two amber/red meds', () => {
    const result = buildDigest([urgent("Feno"), reorder("KBr")]);
    expect(result!.subject).toContain("2 remédios");
  });

  it('uses "3 remédios" for three amber/red meds', () => {
    const result = buildDigest([urgent("Feno"), reorder("KBr"), reorder("Pred")]);
    expect(result!.subject).toContain("3 remédios");
  });

  it("ok meds are not counted in subject", () => {
    // 2 alert + 1 ok → still "2 remédios"
    const result = buildDigest([urgent("Feno"), reorder("KBr"), ok("Pred")]);
    expect(result!.subject).toContain("2 remédios");
  });

  it("subject contains Molly brand prefix", () => {
    const result = buildDigest([urgent("Feno")]);
    expect(result!.subject).toContain("Molly:");
  });
});

describe("buildDigest — null reorderByDate", () => {
  it("handles null reorderByDate gracefully", () => {
    const result = buildDigest([
      { name: "Feno", status: "urgent", daysRemaining: null, reorderByDate: null },
    ]);
    expect(result).not.toBeNull();
    expect(result!.body).toContain("Feno");
    expect(result!.body).toContain("estoque desconhecido");
    expect(result!.body).toContain("data desconhecida");
  });
});
