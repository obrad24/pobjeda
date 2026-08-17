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
