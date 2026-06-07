import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("round-trips: correct password verifies as true", async () => {
    const stored = await hashPassword("correct-horse-battery-staple");
    const result = await verifyPassword("correct-horse-battery-staple", stored);
    expect(result).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const stored = await hashPassword("correct-horse-battery-staple");
    const result = await verifyPassword("wrong-password", stored);
    expect(result).toBe(false);
  });

  it("returns false (no throw) for a corrupted stored value with short hex hash", async () => {
    // "scrypt$deadbeef$00" is structurally valid format but hash is only 1 byte — length mismatch
    await expect(verifyPassword("any-password", "scrypt$deadbeef$00")).resolves.toBe(false);
  });

  it("returns false (no throw) for a completely garbage stored value", async () => {
    await expect(verifyPassword("any-password", "not-a-hash")).resolves.toBe(false);
  });

  it("two hashes of the same password differ due to random salt", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
  });
});
