import { MatchStatus, type Match, type Team } from "../../generated/prisma";
import { getOurTeam, resolveLeague, resolveSeason } from "../context";
import { prisma } from "../db/prisma";
import { parseOrThrow } from "../validation/parse";
import { statsQuerySchema, type StatsQuery } from "../validation/queries";
import { getStandings } from "../league/standings";
import { matchListInclude, type MatchListItem } from "../matches/service";

export type TeamSeasonStatistics = {
  team: Team;
  seasonId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position: number | null;
  nextMatch: MatchListItem | null;
  lastMatch: MatchListItem | null;
  hasMatchData: boolean;
};

function resultForTeam(match: Match, teamId: string) {
  const home = match.homeTeamId === teamId;
  const goalsFor = home ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
  const goalsAgainst = home ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
  let outcome: "won" | "drawn" | "lost" = "drawn";
  if (goalsFor > goalsAgainst) outcome = "won";
  if (goalsFor < goalsAgainst) outcome = "lost";
  return { goalsFor, goalsAgainst, outcome };
}

export async function getTeamStatistics(options?: StatsQuery): Promise<TeamSeasonStatistics> {
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const season = await resolveSeason(query.seasonId);
  const league = await resolveLeague({ seasonId: season.id });
  const team = await getOurTeam();

  const finished = await prisma.match.findMany({
    where: {
      seasonId: season.id,
      leagueId: league.id,
      status: MatchStatus.FINISHED,
      homeScore: { not: null },
      awayScore: { not: null },
      OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
    },
    include: matchListInclude,
    orderBy: { date: "asc" },
  });

  const totals = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  for (const match of finished) {
    const result = resultForTeam(match, team.id);
    totals.played += 1;
    totals.goalsFor += result.goalsFor;
    totals.goalsAgainst += result.goalsAgainst;
    totals[result.outcome] += 1;
  }

  const [standings, nextMatch, lastMatch] = await Promise.all([
    getStandings({ seasonId: season.id, leagueId: league.id }),
    prisma.match.findFirst({
      where: {
        seasonId: season.id,
        status: MatchStatus.SCHEDULED,
        OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
      },
      include: matchListInclude,
      orderBy: { date: "asc" },
    }),
    prisma.match.findFirst({
      where: {
        seasonId: season.id,
        status: MatchStatus.FINISHED,
        OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
      },
      include: matchListInclude,
      orderBy: { date: "desc" },
    }),
  ]);

  const standing = standings.rows.find((row) => row.team.id === team.id);

  return {
    team,
    seasonId: season.id,
    played: totals.played,
    won: totals.won,
    drawn: totals.drawn,
    lost: totals.lost,
    goalsFor: totals.goalsFor,
    goalsAgainst: totals.goalsAgainst,
    goalDiff: totals.goalsFor - totals.goalsAgainst,
    points: totals.won * 3 + totals.drawn,
    position: standing?.position ?? null,
    nextMatch,
    lastMatch,
    hasMatchData: totals.played > 0,
  };
}
