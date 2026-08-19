import { describe, expect, it } from "vitest";
import { credentialsSchema, stripCopiedQuotes } from "./credentials";

describe("stripCopiedQuotes", () => {
  it("removes wrapping quotes copied from .env", () => {
    expect(stripCopiedQuotes('"Trijesnica2026!"')).toBe("Trijesnica2026!");
  });
});

describe("credentialsSchema", () => {
  it("accepts Auth.js string[] field values", () => {
    const parsed = credentialsSchema.safeParse({
      email: ["makso@admin.com"],
      password: ["secret"],
      callbackUrl: "/admin",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ email: "makso@admin.com", password: "secret" });
    }
  });
});
