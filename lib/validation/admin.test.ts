import { describe, expect, it } from "vitest";
import { historyInputSchema, seasonInputSchema } from "./admin";

describe("season validation", () => {
  it("accepts a named season", () => {
    const parsed = seasonInputSchema.parse({
      name: "2026-2027",
      startDate: "2026-08-01",
      endDate: "",
      active: true,
    });
    expect(parsed.name).toBe("2026-2027");
    expect(parsed.startDate).toBe("2026-08-01");
    expect(parsed.endDate).toBeNull();
  });

  it("rejects a short name", () => {
    const result = seasonInputSchema.safeParse({ name: "26" });
    expect(result.success).toBe(false);
  });
});

describe("history validation", () => {
  it("accepts a published entry", () => {
    const parsed = historyInputSchema.parse({
      title: "Osnivanje",
      body: "Klub je osnovan 1976.",
      year: 1976,
      sortOrder: 1,
      published: true,
    });
    expect(parsed.title).toBe("Osnivanje");
  });

  it("rejects empty body", () => {
    const result = historyInputSchema.safeParse({
      title: "Test",
      body: "   ",
    });
    expect(result.success).toBe(false);
  });
});
