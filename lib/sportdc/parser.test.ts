import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseGames, parseLeagueMeta, parseStandings, teamsByTableIndex } from "./parser";
import { isOurClub } from "./teams";

const round1 = readFileSync(
  path.join(__dirname, "__fixtures__/league-6452-round1.html"),
  "utf8",
);
const finished = readFileSync(
  path.join(__dirname, "__fixtures__/finished-games.html"),
  "utf8",
);

describe("SportDC parser", () => {
  it("parses 14 clubs, league 6452 and Pobjeda 8448", () => {
    const meta = parseLeagueMeta(
      round1,
      "https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina",
      6452,
    );
    const standings = parseStandings(round1);

    expect(meta.sportdcLeagueId).toBe(6452);
    expect(meta.seasonName).toBe("2026-2027");
    expect(meta.totalRounds).toBe(26);
    expect(standings).toHaveLength(14);

    const pobjeda = standings.find((row) => row.sportdcTeamId === 8448);
    expect(pobjeda?.sportdcName).toBe("Pobjeda");
    expect(pobjeda?.city).toContain("Triješnica");
    expect(isOurClub(pobjeda!)).toBe(true);

    const boracIds = standings
      .filter((row) => row.sportdcName === "Borac")
      .map((row) => row.sportdcTeamId)
      .sort((a, b) => a - b);
    expect(boracIds).toEqual([7421, 7802]);
  });

  it("maps match 604152 to Pobjeda 8448 vs Borac 7802 as scheduled", () => {
    const standings = parseStandings(round1);
    const matches = parseGames(round1, teamsByTableIndex(standings), 1);
    const match = matches.find((item) => item.sportdcMatchId === 604152);

    expect(match).toBeTruthy();
    expect(match?.homeTeamId).toBe(8448);
    expect(match?.awayTeamId).toBe(7802);
    expect(match?.status).toBe("SCHEDULED");
    expect(match?.homeScore).toBeNull();
    expect(match?.awayScore).toBeNull();
    expect(match?.time).toBe("17:30");
    expect(match?.stadium).toBe("Triješnica");
    expect(matches).toHaveLength(7);
  });

  it("treats 0-0 with score nodes as finished, not scheduled", () => {
    const standings = parseStandings(finished);
    const matches = parseGames(finished, teamsByTableIndex(standings), 22);
    const draw = matches.find((item) => item.sportdcMatchId === 579050);
    const win = matches.find((item) => item.sportdcMatchId === 800010);

    expect(draw?.status).toBe("FINISHED");
    expect(draw?.homeScore).toBe(0);
    expect(draw?.awayScore).toBe(0);
    expect(draw?.homeTeamId).toBe(7596);
    expect(draw?.awayTeamId).toBe(7594);

    expect(win?.status).toBe("FINISHED");
    expect(win?.homeScore).toBe(3);
    expect(win?.awayScore).toBe(1);
    expect(win?.homeTeamId).toBe(8448);
  });

  it("keeps later rounds without a kickoff datetime", () => {
    const standings = parseStandings(finished);
    const matches = parseGames(finished, teamsByTableIndex(standings), 14);
    const later = matches.find((item) => item.sportdcMatchId === 604241);

    expect(later?.status).toBe("SCHEDULED");
    expect(later?.homeTeamId).toBe(7596);
    expect(later?.awayTeamId).toBe(7594);
    expect(later?.homeScore).toBeNull();
    expect(Number.isNaN(later?.date.getTime())).toBe(false);
  });

  it("does not identify a club as Pobjeda by short name alone", () => {
    expect(
      isOurClub({ sportdcTeamId: 1, sportdcName: "Pobjeda", city: "Banja Luka" }),
    ).toBe(false);
    expect(
      isOurClub({
        sportdcTeamId: 99,
        sportdcName: "Pobjeda",
        city: "Triješnica",
      }),
    ).toBe(true);
  });
});
