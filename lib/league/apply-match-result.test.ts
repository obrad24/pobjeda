import { describe, expect, it } from "vitest";
import { applyScoreToStandingRow, rankStandingRows, type StandingScoreRow } from "./apply-match-result";

function row(id: number, points: number, extras: Partial<StandingScoreRow> = {}): StandingScoreRow {
  return {
    sportdcTeamId: id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points,
    position: 0,
    ...extras,
  };
}

describe("applyScoreToStandingRow", () => {
  it("awards 3 points for a win and can reverse the same result", () => {
    const home = row(1, 0);
    applyScoreToStandingRow(home, 2, 0, 1);
    expect(home).toMatchObject({ played: 1, won: 1, points: 3, goalsFor: 2, goalDiff: 2 });

    applyScoreToStandingRow(home, 2, 0, -1);
    expect(home).toMatchObject({ played: 0, won: 0, points: 0, goalsFor: 0, goalDiff: 0 });
  });

  it("awards 1 point for a draw", () => {
    const team = row(1, 0);
    applyScoreToStandingRow(team, 1, 1, 1);
    expect(team).toMatchObject({ played: 1, drawn: 1, points: 1, goalDiff: 0 });
  });
});

describe("rankStandingRows", () => {
  it("sorts by points then goal difference", () => {
    const ranked = rankStandingRows(
      [
        row(1, 3, { goalDiff: 1, goalsFor: 1 }),
        row(2, 3, { goalDiff: 2, goalsFor: 2 }),
        row(3, 0),
      ],
      new Map([
        [1, "Alpha"],
        [2, "Beta"],
        [3, "Ceta"],
      ]),
    );

    expect(ranked.map((item) => item.sportdcTeamId)).toEqual([2, 1, 3]);
    expect(ranked.map((item) => item.position)).toEqual([1, 2, 3]);
  });
});
