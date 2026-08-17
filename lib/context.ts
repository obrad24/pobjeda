import type { League, Season, Team } from "../generated/prisma";
import { prisma } from "./db/prisma";
import { NotFoundError } from "./errors";
import { parseOrThrow } from "./validation/parse";
import { idSchema, standingsQuerySchema } from "./validation/queries";

export type SeasonWithLeagues = Season & { leagues: League[] };
export type LeagueWithSeason = League & { season: Season };

export async function getActiveSeason(): Promise<SeasonWithLeagues> {
  const season = await prisma.season.findFirst({
    where: { active: true },
    include: { leagues: { orderBy: { createdAt: "asc" } } },
  });

  if (!season) {
    throw new NotFoundError("Nema aktivne sezone");
  }

  return season;
}

export async function getOurTeam(): Promise<Team> {
  const team = await prisma.team.findFirst({ where: { isOurTeam: true } });
  if (!team) {
    throw new NotFoundError("Naš tim nije pronađen");
  }
  return team;
}

export async function resolveSeason(seasonId?: string): Promise<SeasonWithLeagues> {
  if (!seasonId) {
    return getActiveSeason();
  }

  parseOrThrow(idSchema, seasonId);
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { leagues: { orderBy: { createdAt: "asc" } } },
  });

  if (!season) {
    throw new NotFoundError("Sezona nije pronađena");
  }

  return season;
}

export async function resolveLeague(options?: {
  seasonId?: string;
  leagueId?: string;
}): Promise<LeagueWithSeason> {
  const query = parseOrThrow(standingsQuerySchema, options ?? {});

  if (query.leagueId) {
    const league = await prisma.league.findUnique({
      where: { id: query.leagueId },
      include: { season: true },
    });
    if (!league) {
      throw new NotFoundError("Liga nije pronađena");
    }
    return league;
  }

  const season = await resolveSeason(query.seasonId);
  const league = season.leagues[0];
  if (!league) {
    throw new NotFoundError("Liga nije pronađena za sezonu");
  }

  return { ...league, season };
}
