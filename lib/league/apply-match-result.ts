import { MatchStatus } from "../../generated/prisma";
import { prisma } from "../db/prisma";
import { computeStandings } from "./compute-standings";

export type StandingScoreRow = {
  sportdcTeamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position: number;
};

export function applyScoreToStandingRow(
  row: StandingScoreRow,
  goalsFor: number,
  goalsAgainst: number,
  sign: 1 | -1,
) {
  row.played += sign;
  row.goalsFor += sign * goalsFor;
  row.goalsAgainst += sign * goalsAgainst;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  if (goalsFor > goalsAgainst) {
    row.won += sign;
    row.points += sign * 3;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += sign;
    row.points += sign;
  } else {
    row.lost += sign;
  }
}

export function rankStandingRows(
  rows: StandingScoreRow[],
  names: Map<number, string>,
): StandingScoreRow[] {
  return [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return (names.get(a.sportdcTeamId) ?? "").localeCompare(names.get(b.sportdcTeamId) ?? "", "sr-Latn");
    })
    .map((row, index) => ({ ...row, position: index + 1 }));
}

type StandingsDb = Pick<typeof prisma, "team" | "match" | "leagueStanding">;

function emptyStanding(sportdcTeamId: number): StandingScoreRow {
  return {
    sportdcTeamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    position: 0,
  };
}

function wasFinished(match: { status: MatchStatus | string; homeScore: number | null; awayScore: number | null }) {
  return match.status === MatchStatus.FINISHED && match.homeScore != null && match.awayScore != null;
}

async function writeStandings(
  tx: StandingsDb,
  leagueId: string,
  rows: StandingScoreRow[],
) {
  await tx.leagueStanding.deleteMany({ where: { leagueId } });
  if (rows.length === 0) {
    return;
  }
  await tx.leagueStanding.createMany({
    data: rows.map((row) => ({
      leagueId,
      sportdcTeamId: row.sportdcTeamId,
      position: row.position,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDiff: row.goalDiff,
      points: row.points,
    })),
  });
}

export async function persistComputedStandings(tx: StandingsDb, leagueId: string) {
  const [teams, matches] = await Promise.all([
    tx.team.findMany({ orderBy: { name: "asc" } }),
    tx.match.findMany({
      where: {
        leagueId,
        round: { gt: 0 },
        status: MatchStatus.FINISHED,
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const computed = computeStandings(matches, teams);
  await writeStandings(
    tx,
    leagueId,
    computed.flatMap((row) =>
      row.team.sportdcTeamId == null
        ? []
        : [
            {
              sportdcTeamId: row.team.sportdcTeamId,
              played: row.played,
              won: row.won,
              drawn: row.drawn,
              lost: row.lost,
              goalsFor: row.goalsFor,
              goalsAgainst: row.goalsAgainst,
              goalDiff: row.goalDiff,
              points: row.points,
              position: row.position,
            },
          ],
    ),
  );
}

export async function applyMatchResultToStandings(
  tx: StandingsDb,
  match: {
    leagueId: string;
    round: number;
    homeTeamId: string;
    awayTeamId: string;
    status: MatchStatus;
    homeScore: number | null;
    awayScore: number | null;
  },
  next: { homeScore: number; awayScore: number },
) {
  if (match.round <= 0) {
    return;
  }

  const cached = await tx.leagueStanding.findMany({ where: { leagueId: match.leagueId } });
  if (cached.length === 0) {
    await persistComputedStandings(tx, match.leagueId);
    return;
  }

  const teams = await tx.team.findMany();
  const byId = new Map(teams.map((team) => [team.id, team]));
  const home = byId.get(match.homeTeamId);
  const away = byId.get(match.awayTeamId);
  if (!home || !away) {
    return;
  }

  const rows = new Map<number, StandingScoreRow>();
  for (const row of cached) {
    rows.set(row.sportdcTeamId, {
      sportdcTeamId: row.sportdcTeamId,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDiff: row.goalDiff,
      points: row.points,
      position: row.position,
    });
  }

  if (!rows.has(home.sportdcTeamId)) {
    rows.set(home.sportdcTeamId, emptyStanding(home.sportdcTeamId));
  }
  if (!rows.has(away.sportdcTeamId)) {
    rows.set(away.sportdcTeamId, emptyStanding(away.sportdcTeamId));
  }

  if (wasFinished(match)) {
    applyScoreToStandingRow(rows.get(home.sportdcTeamId)!, match.homeScore!, match.awayScore!, -1);
    applyScoreToStandingRow(rows.get(away.sportdcTeamId)!, match.awayScore!, match.homeScore!, -1);
  }

  applyScoreToStandingRow(rows.get(home.sportdcTeamId)!, next.homeScore, next.awayScore, 1);
  applyScoreToStandingRow(rows.get(away.sportdcTeamId)!, next.awayScore, next.homeScore, 1);

  const names = new Map(teams.map((team) => [team.sportdcTeamId, team.name]));
  await writeStandings(tx, match.leagueId, rankStandingRows([...rows.values()], names));
}
