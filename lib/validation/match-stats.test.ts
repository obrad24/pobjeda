import { describe, expect, it } from "vitest";
import { matchStatisticsSchema } from "../validation/match-stats";

describe("matchStatisticsSchema", () => {
  it("requires scorers and assistants to be in the lineup", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [{ playerId: "p1", starter: true }],
      goals: [{ playerId: "p2", minute: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 11 starters", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: Array.from({ length: 12 }, (_, index) => ({
        playerId: `p${index}`,
        starter: true,
      })),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid lineup with a goal and assist", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [
        { playerId: "p1", starter: true },
        { playerId: "p2", starter: true },
      ],
      goals: [{ playerId: "p1", assistPlayerId: "p2", minute: 23 }],
      cards: [{ playerId: "p2", type: "YELLOW", minute: 40 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a goal without minute or assist", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [{ playerId: "p1", starter: true }],
      goals: [{ playerId: "p1" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goals[0]?.minute ?? null).toBeNull();
      expect(result.data.goals[0]?.assistPlayerId ?? null).toBeNull();
    }
  });

  it("accepts substitutions with optional minutes", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [
        { playerId: "p1", starter: true },
        { playerId: "p2", starter: false },
      ],
      substitutions: [{ playerOutId: "p1", playerInId: "p2" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a substitution with the same player twice", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [{ playerId: "p1", starter: true }],
      substitutions: [{ playerOutId: "p1", playerInId: "p1", minute: 60 }],
    });
    expect(result.success).toBe(false);
  });

  it("requires both scores when one is provided", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [{ playerId: "p1", starter: true }],
      homeScore: 2,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a finished result", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [{ playerId: "p1", starter: true }],
      homeScore: 2,
      awayScore: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an assist on an own goal", () => {
    const result = matchStatisticsSchema.safeParse({
      lineups: [
        { playerId: "p1", starter: true },
        { playerId: "p2", starter: true },
      ],
      goals: [{ playerId: "p1", assistPlayerId: "p2", minute: 23, ownGoal: true }],
    });
    expect(result.success).toBe(false);
  });
});
