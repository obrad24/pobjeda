import { describe, expect, it } from "vitest";
import { applySubstitutionsToLineups } from "./substitutions";

describe("applySubstitutionsToLineups", () => {
  it("leaves lineup unchanged when there are no substitutions", () => {
    const lineups = [{ playerId: "a", starter: true, enteredAt: 10, substitutedAt: 80 }];
    expect(applySubstitutionsToLineups(lineups, [])).toEqual(lineups);
  });

  it("sets exit and entry minutes from substitutions", () => {
    const result = applySubstitutionsToLineups(
      [
        { playerId: "a", starter: true },
        { playerId: "b", starter: false },
      ],
      [{ playerOutId: "a", playerInId: "b", minute: 62 }],
    );

    expect(result).toEqual([
      { playerId: "a", starter: true, enteredAt: null, substitutedAt: 62 },
      { playerId: "b", starter: false, enteredAt: 62, substitutedAt: null },
    ]);
  });

  it("keeps a substitute off the starting eleven", () => {
    const result = applySubstitutionsToLineups(
      [
        { playerId: "a", starter: true },
        { playerId: "b", starter: true },
      ],
      [{ playerOutId: "a", playerInId: "b" }],
    );

    expect(result.find((row) => row.playerId === "b")?.starter).toBe(false);
    expect(result.find((row) => row.playerId === "b")?.enteredAt).toBeNull();
  });
});
