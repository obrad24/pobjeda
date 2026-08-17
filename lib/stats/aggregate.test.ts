import { CardType } from "../../generated/prisma";
import { describe, expect, it } from "vitest";
import { aggregateSeasonStats, sortByMetric } from "./aggregate";

describe("aggregateSeasonStats", () => {
  it("uses MatchGoal events when they exist and ignores MatchPlayer counters", () => {
    const totals = aggregateSeasonStats(
      [
        {
          playerId: "striker",
          matchId: "m1",
          minutes: 90,
          goals: 99,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        },
        {
          playerId: "playmaker",
          matchId: "m1",
          minutes: 90,
          goals: 0,
          assists: 99,
          yellowCards: 0,
          redCards: 0,
        },
      ],
      [
        { matchId: "m1", playerId: "striker", assistPlayerId: "playmaker" },
        { matchId: "m1", playerId: "striker", assistPlayerId: null },
      ],
      [],
    );

    expect(totals.get("striker")).toMatchObject({ appearances: 1, goals: 2, assists: 0, minutes: 90 });
    expect(totals.get("playmaker")).toMatchObject({ appearances: 1, goals: 0, assists: 1 });
  });

  it("falls back to MatchPlayer counters when a match has no events", () => {
    const totals = aggregateSeasonStats(
      [
        {
          playerId: "striker",
          matchId: "m1",
          minutes: 90,
          goals: 2,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        },
        {
          playerId: "striker",
          matchId: "m2",
          minutes: 45,
          goals: 1,
          assists: 1,
          yellowCards: 1,
          redCards: 0,
        },
      ],
      [{ matchId: "m1", playerId: "striker", assistPlayerId: null }],
      [],
    );

    expect(totals.get("striker")).toMatchObject({
      appearances: 2,
      minutes: 135,
      goals: 2,
      assists: 1,
      yellowCards: 1,
    });
  });

  it("counts SECOND_YELLOW as both yellow and red", () => {
    const totals = aggregateSeasonStats(
      [
        {
          playerId: "defender",
          matchId: "m1",
          minutes: 70,
          goals: 0,
          assists: 0,
          yellowCards: 9,
          redCards: 9,
        },
      ],
      [],
      [{ matchId: "m1", playerId: "defender", type: CardType.SECOND_YELLOW }],
    );

    expect(totals.get("defender")).toMatchObject({ yellowCards: 1, redCards: 1 });
  });

  it("does not count own goals as scored goals or assists", () => {
    const totals = aggregateSeasonStats(
      [
        {
          playerId: "defender",
          matchId: "m1",
          minutes: 90,
          goals: 1,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        },
        {
          playerId: "mid",
          matchId: "m1",
          minutes: 90,
          goals: 0,
          assists: 1,
          yellowCards: 0,
          redCards: 0,
        },
      ],
      [{ matchId: "m1", playerId: "defender", assistPlayerId: "mid", ownGoal: true }],
      [],
    );

    expect(totals.get("defender")).toMatchObject({ goals: 0 });
    expect(totals.get("mid")).toMatchObject({ assists: 0 });
  });

  it("sorts leaders by metric then appearances", () => {
    const sorted = sortByMetric(
      [
        { playerId: "a", appearances: 2, minutes: 180, goals: 3, assists: 0, yellowCards: 0, redCards: 0 },
        { playerId: "b", appearances: 4, minutes: 360, goals: 3, assists: 1, yellowCards: 0, redCards: 0 },
      ],
      "goals",
    );

    expect(sorted.map((row) => row.playerId)).toEqual(["b", "a"]);
  });
});
