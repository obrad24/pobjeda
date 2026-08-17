import { describe, expect, it } from "vitest";
import { computeStandings } from "./compute-standings";

describe("computeStandings", () => {
  const teams = [
    { id: "a", name: "Alpha", isOurTeam: true },
    { id: "b", name: "Beta" },
    { id: "c", name: "Ceta" },
  ];

  it("awards 3 points for a win and 1 for a draw, then sorts by points", () => {
    const table = computeStandings(
      [
        { homeTeamId: "a", awayTeamId: "b", homeScore: 2, awayScore: 1 },
        { homeTeamId: "c", awayTeamId: "a", homeScore: 0, awayScore: 0 },
        { homeTeamId: "b", awayTeamId: "c", homeScore: 3, awayScore: 0 },
      ],
      teams,
    );

    expect(table.map((row) => row.team.name)).toEqual(["Alpha", "Beta", "Ceta"]);
    expect(table[0]).toMatchObject({
      position: 1,
      points: 4,
      played: 2,
      won: 1,
      drawn: 1,
      goalsFor: 2,
      goalDiff: 1,
    });
    expect(table[1]).toMatchObject({
      position: 2,
      points: 3,
      played: 2,
      won: 1,
      lost: 1,
      goalsFor: 4,
      goalDiff: 2,
    });
    expect(table[2]).toMatchObject({
      position: 3,
      points: 1,
      drawn: 1,
      lost: 1,
      goalDiff: -3,
    });
  });

  it("breaks ties by goal difference then goals scored", () => {
    const table = computeStandings(
      [
        { homeTeamId: "a", awayTeamId: "c", homeScore: 1, awayScore: 0 },
        { homeTeamId: "b", awayTeamId: "c", homeScore: 2, awayScore: 0 },
      ],
      teams,
    );

    expect(table.map((row) => row.team.name)).toEqual(["Beta", "Alpha", "Ceta"]);
    expect(table[0]).toMatchObject({ points: 3, goalDiff: 2, goalsFor: 2 });
    expect(table[1]).toMatchObject({ points: 3, goalDiff: 1, goalsFor: 1 });
  });

  it("skips matches without both scores", () => {
    const table = computeStandings(
      [{ homeTeamId: "a", awayTeamId: "b", homeScore: null, awayScore: null }],
      teams,
    );

    expect(table.every((row) => row.played === 0 && row.points === 0)).toBe(true);
  });
});
