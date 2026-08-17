import { describe, expect, it } from "vitest";
import { resolveMinutes } from "./minutes";

describe("resolveMinutes", () => {
  it("uses explicit minutes when provided", () => {
    expect(resolveMinutes({ playerId: "a", starter: true, minutes: 45 })).toBe(45);
  });

  it("gives starters 90 minutes when they finish the match", () => {
    expect(resolveMinutes({ playerId: "a", starter: true })).toBe(90);
  });

  it("uses substitution minute for starters who leave", () => {
    expect(resolveMinutes({ playerId: "a", starter: true, substitutedAt: 70 })).toBe(70);
  });

  it("computes substitute minutes from entry to 90", () => {
    expect(resolveMinutes({ playerId: "a", starter: false, enteredAt: 70 })).toBe(20);
  });
});
