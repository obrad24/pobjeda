import { describe, expect, it } from "vitest";
import { createPlayerSchema, updatePlayerSchema } from "./player";
import { matchListQuerySchema } from "./queries";

describe("player validation", () => {
  it("accepts a valid create payload", () => {
    const parsed = createPlayerSchema.parse({
      firstName: "Luka",
      lastName: "Popović",
      position: "FW",
      jerseyNumber: 7,
      birthYear: 2001,
    });

    expect(parsed.firstName).toBe("Luka");
    expect(parsed.position).toBe("FW");
  });

  it("rejects an empty first name", () => {
    const result = createPlayerSchema.safeParse({
      firstName: "   ",
      lastName: "Test",
      position: "MF",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid image URL", () => {
    const result = createPlayerSchema.safeParse({
      firstName: "Luka",
      lastName: "Test",
      position: "FW",
      image: "javascript:alert(1)",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty update", () => {
    const result = updatePlayerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("turns an empty image into null", () => {
    const parsed = createPlayerSchema.parse({
      firstName: "Luka",
      lastName: "Test",
      position: "FW",
      image: "",
    });

    expect(parsed.image).toBeNull();
  });

  it("accepts a long https image URL", () => {
    const image = `https://abc.public.blob.vercel-storage.com/players/${"x".repeat(80)}.jpg`;
    const parsed = createPlayerSchema.parse({
      firstName: "Luka",
      lastName: "Test",
      position: "FW",
      image,
    });
    expect(parsed.image).toBe(image);
  });
});

describe("match query validation", () => {
  it("rejects an invalid round", () => {
    const result = matchListQuerySchema.safeParse({ round: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts league list filters", () => {
    const parsed = matchListQuerySchema.parse({
      ourTeamOnly: true,
      limit: 3,
      includeFriendlies: false,
    });

    expect(parsed.limit).toBe(3);
  });
});
