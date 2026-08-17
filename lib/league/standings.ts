import { MatchStatus } from "../../generated/prisma";
import { resolveLeague } from "../context";
import { prisma } from "../db/prisma";
import { parseOrThrow } from "../validation/parse";
import { standingsQuerySchema, type StandingsQuery } from "../validation/queries";
import { computeStandings, type ComputedStandingRow } from "./compute-standings";

export type StandingRow = {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  team: {
    id: string;
    name: string;
    city: string | null;
    logo: string | null;
    sportdcTeamId: number;
    isOurTeam: boolean;
  };
};

export type StandingsTable = {
  source: "SPORTDC" | "COMPUTED" | "EMPTY";
  leagueId: string;
  seasonId: string;
  updatedAt: Date | null;
  rows: StandingRow[];
};

function toPublicRow(row: ComputedStandingRow): StandingRow | null {
  if (row.team.sportdcTeamId == null) {
    return null;
  }

  return {
    position: row.position,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalDiff,
    points: row.points,
    team: {
      id: row.team.id,
      name: row.team.name,
      city: row.team.city ?? null,
      logo: row.team.logo ?? null,
      sportdcTeamId: row.team.sportdcTeamId,
      isOurTeam: row.team.isOurTeam ?? false,
    },
  };
}

async function computeFromMatches(leagueId: string): Promise<{
  updatedAt: Date | null;
  rows: StandingRow[];
}> {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
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
  const latest = matches.at(-1)?.updatedAt ?? null;
  return {
    updatedAt: latest,
    rows: computed.map(toPublicRow).filter((row): row is StandingRow => row !== null),
  };
}

/**
 * Javna tabela: SportDC `LeagueStanding` je source of truth.
 * Ako keš ne postoji, računa se iz FINISHED ligaških utakmica.
 */
export async function getStandings(options?: StandingsQuery): Promise<StandingsTable> {
  const query = parseOrThrow(standingsQuerySchema, options ?? {});
  const league = await resolveLeague(query);

  const cached = await prisma.leagueStanding.findMany({
    where: { leagueId: league.id },
    orderBy: { position: "asc" },
  });

  if (cached.length > 0) {
    const teams = await prisma.team.findMany();
    const bySportDcId = new Map(teams.map((team) => [team.sportdcTeamId, team]));
    const rows: StandingRow[] = [];

    for (const row of cached) {
      const team = bySportDcId.get(row.sportdcTeamId);
      if (!team) {
        continue;
      }
      rows.push({
        position: row.position,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDiff: row.goalDiff,
        points: row.points,
        team: {
          id: team.id,
          name: team.name,
          city: team.city,
          logo: team.logo,
          sportdcTeamId: team.sportdcTeamId,
          isOurTeam: team.isOurTeam,
        },
      });
    }

    const updatedAt = cached.reduce<Date | null>((latest, row) => {
      if (!latest || row.updatedAt > latest) return row.updatedAt;
      return latest;
    }, null);

    return {
      source: "SPORTDC",
      leagueId: league.id,
      seasonId: league.seasonId,
      updatedAt,
      rows,
    };
  }

  const computed = await computeFromMatches(league.id);
  return {
    source: computed.rows.some((row) => row.played > 0) ? "COMPUTED" : "EMPTY",
    leagueId: league.id,
    seasonId: league.seasonId,
    updatedAt: computed.updatedAt,
    rows: computed.rows,
  };
}

export async function getComputedStandings(options?: StandingsQuery): Promise<StandingsTable> {
  const query = parseOrThrow(standingsQuerySchema, options ?? {});
  const league = await resolveLeague(query);
  const computed = await computeFromMatches(league.id);

  return {
    source: computed.rows.some((row) => row.played > 0) ? "COMPUTED" : "EMPTY",
    leagueId: league.id,
    seasonId: league.seasonId,
    updatedAt: computed.updatedAt,
    rows: computed.rows,
  };
}
