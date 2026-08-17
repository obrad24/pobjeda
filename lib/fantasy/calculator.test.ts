import { describe, expect, it } from "vitest";
import { calculateMatchFantasy, calculateMatchPlayerPoints } from "./calculator";
import { DEFAULT_SCORING_POINTS } from "./rules";
import type { MatchFantasySource, MatchFantasyContext, PlayerMatchFantasyInput } from "./types";

const mid90: PlayerMatchFantasyInput = {
  playerId: "mid",
  position: "MF",
  minutes: 90,
  starter: true,
  enteredAt: null,
  substitutedAt: null,
  goals: 0,
  assists: 0,
  ownGoals: 0,
  yellowCards: 0,
  redCards: 0,
  secondYellow: false,
  penaltyMisses: 0,
  saves: 0,
  penaltySaves: 0,
};

const noCleanSheet: MatchFantasyContext = { goalsAgainst: 1, concededMinutes: [] };
const cleanSheet: MatchFantasyContext = { goalsAgainst: 0, concededMinutes: [] };

function points(player: Partial<PlayerMatchFantasyInput>, context = cleanSheet) {
  return calculateMatchPlayerPoints({ ...mid90, ...player }, context, DEFAULT_SCORING_POINTS);
}

describe("calculateMatchPlayerPoints", () => {
  it("awards appearance only", () => {
    const result = points({}, noCleanSheet);
    expect(result.breakdown).toMatchObject({ appearance: 2, cleanSheet: 0, total: 2 });
    expect(result.points).toBe(2);
  });

  it("adds a midfielder goal", () => {
    expect(points({ goals: 1 }, noCleanSheet).points).toBe(7);
    expect(points({ goals: 1 }, noCleanSheet).breakdown.goals).toBe(5);
  });

  it("adds an assist", () => {
    expect(points({ assists: 1 }, noCleanSheet).points).toBe(6);
    expect(points({ assists: 1 }, noCleanSheet).breakdown.assists).toBe(4);
  });

  it("awards midfielder clean sheet at 60+ minutes", () => {
    const result = points({ minutes: 90 });
    expect(result.breakdown.cleanSheet).toBe(2);
    expect(result.points).toBe(4);
  });

  it("awards goalkeeper clean sheet", () => {
    const result = points({ playerId: "gk", position: "GK", minutes: 90 });
    expect(result.breakdown.cleanSheet).toBe(4);
    expect(result.points).toBe(6);
  });

  it("awards defender clean sheet", () => {
    expect(points({ position: "DF" }).breakdown.cleanSheet).toBe(4);
  });

  it("does not award forward clean sheet points", () => {
    expect(points({ position: "FW" }).breakdown.cleanSheet).toBe(0);
    expect(points({ position: "FW" }).points).toBe(2);
  });

  it("maps winger to midfield scoring", () => {
    const result = points({ position: "WG", goals: 1 });
    expect(result.position).toBe("MID");
    expect(result.breakdown.goals).toBe(5);
    expect(result.breakdown.cleanSheet).toBe(2);
  });

  it("subtracts a missed penalty", () => {
    expect(points({ penaltyMisses: 1 }).breakdown.penaltyMiss).toBe(-2);
  });

  it("subtracts a yellow card", () => {
    expect(points({ yellowCards: 1 }).breakdown.yellowCard).toBe(-1);
    expect(points({ yellowCards: 1 }).points).toBe(3);
  });

  it("subtracts a straight red card", () => {
    expect(points({ redCards: 1 }).breakdown.redCard).toBe(-3);
  });

  it("does not double-count second yellow as yellow plus red", () => {
    const result = points({ yellowCards: 1, secondYellow: true, redCards: 0 });
    expect(result.breakdown.yellowCard).toBe(0);
    expect(result.breakdown.redCard).toBe(-3);
    expect(result.points).toBe(1);
  });

  it("keeps yellow plus straight red as both penalties", () => {
    const result = points({ yellowCards: 1, redCards: 1, secondYellow: false });
    expect(result.breakdown.yellowCard).toBe(-1);
    expect(result.breakdown.redCard).toBe(-3);
  });

  it("subtracts an own goal and does not treat it as a scored goal", () => {
    const result = points({ ownGoals: 1, goals: 0 });
    expect(result.breakdown.ownGoal).toBe(-2);
    expect(result.breakdown.goals).toBe(0);
  });

  it("multiplies several goals", () => {
    expect(points({ goals: 2, position: "FW" }).breakdown.goals).toBe(10);
  });

  it("multiplies several assists", () => {
    expect(points({ assists: 2 }).breakdown.assists).toBe(8);
  });

  it("combines positive and negative actions (spec example)", () => {
    const result = points({
      minutes: 90,
      goals: 1,
      assists: 1,
      yellowCards: 1,
      penaltyMisses: 1,
    });
    expect(result.breakdown).toMatchObject({
      appearance: 2,
      cleanSheet: 2,
      goals: 5,
      assists: 4,
      yellowCard: -1,
      penaltyMiss: -2,
      total: 10,
    });
    expect(result.points).toBe(10);
  });

  it("gives nothing to a player who did not appear", () => {
    const result = points({ minutes: 0 });
    expect(result.points).toBe(0);
    expect(result.breakdown.appearance).toBe(0);
    expect(result.breakdown.cleanSheet).toBe(0);
  });

  it("does not award clean sheet under 60 minutes", () => {
    const result = points({ minutes: 59, enteredAt: 31, starter: false });
    expect(result.breakdown.appearance).toBe(2);
    expect(result.breakdown.cleanSheet).toBe(0);
    expect(result.points).toBe(2);
  });

  it("awards clean sheet at exactly 60 minutes", () => {
    const result = points({ minutes: 60, substitutedAt: 60 });
    expect(result.breakdown.cleanSheet).toBe(2);
  });

  it("keeps clean sheet if the team concedes after the player left at 60+", () => {
    const result = points(
      { minutes: 70, substitutedAt: 70 },
      { goalsAgainst: 1, concededMinutes: [80] },
    );
    expect(result.breakdown.cleanSheet).toBe(2);
  });

  it("denies clean sheet if the player was on the pitch for a conceded goal", () => {
    const result = points({ minutes: 90 }, { goalsAgainst: 1, concededMinutes: [40] });
    expect(result.breakdown.cleanSheet).toBe(0);
  });

  it("denies clean sheet when concessions happened but minutes are unknown", () => {
    const result = points({ minutes: 90 }, { goalsAgainst: 1, concededMinutes: [] });
    expect(result.breakdown.cleanSheet).toBe(0);
  });

  it("does not award clean sheet to a sub who entered after minute 60", () => {
    const result = points(
      { starter: false, enteredAt: 70, minutes: 20 },
      { goalsAgainst: 0, concededMinutes: [] },
    );
    expect(result.breakdown.cleanSheet).toBe(0);
    expect(result.points).toBe(2);
  });

  it("awards goalkeeper save batches and penalty saves", () => {
    const result = points({ position: "GK", saves: 7, penaltySaves: 1 });
    expect(result.breakdown.saves).toBe(2);
    expect(result.breakdown.penaltySave).toBe(5);
  });

  it("does not award saves to outfield players", () => {
    expect(points({ position: "DF", saves: 6, penaltySaves: 1 }).breakdown.saves).toBe(0);
    expect(points({ position: "DF", saves: 6, penaltySaves: 1 }).breakdown.penaltySave).toBe(0);
  });

  it("uses defender and goalkeeper goal values", () => {
    expect(points({ position: "DF", goals: 1 }).breakdown.goals).toBe(6);
    expect(points({ position: "GK", goals: 1 }).breakdown.goals).toBe(8);
  });
});

describe("calculateMatchFantasy", () => {
  const source: MatchFantasySource = {
    goalsAgainst: 0,
    concededMinutes: [],
    lineups: [
      {
        playerId: "mid",
        position: "MF",
        minutes: 90,
        starter: true,
        enteredAt: null,
        substitutedAt: null,
        saves: 0,
        penaltySaves: 0,
      },
    ],
    goals: [{ playerId: "mid", assistPlayerId: null, ownGoal: false }],
    cards: [],
    penaltyMisses: [],
  };

  it("scores from match events and ignores a player who is not in the lineup", () => {
    const rows = calculateMatchFantasy(source, DEFAULT_SCORING_POINTS);
    expect(rows).toHaveLength(1);
    expect(rows[0].points).toBe(9);
  });

  it("does not count an own goal as a scored goal", () => {
    const rows = calculateMatchFantasy(
      {
        ...source,
        goals: [{ playerId: "mid", assistPlayerId: "helper", ownGoal: true }],
      },
      DEFAULT_SCORING_POINTS,
    );
    expect(rows[0].breakdown.goals).toBe(0);
    expect(rows[0].breakdown.assists).toBe(0);
    expect(rows[0].breakdown.ownGoal).toBe(-2);
  });

  it("is deterministic: same stats produce the same points after a change and revert", () => {
    const first = calculateMatchFantasy(source, DEFAULT_SCORING_POINTS);
    const changed = calculateMatchFantasy(
      { ...source, cards: [{ playerId: "mid", type: "YELLOW" }] },
      DEFAULT_SCORING_POINTS,
    );
    const reverted = calculateMatchFantasy(source, DEFAULT_SCORING_POINTS);
    expect(changed[0].points).toBe(first[0].points - 1);
    expect(reverted).toEqual(first);
  });
});
