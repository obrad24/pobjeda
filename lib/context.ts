import { cache } from "react";
import type { League, Season, Team } from "../generated/prisma";
import { prisma } from "./db/prisma";
import { NotFoundError } from "./errors";
import { parseOrThrow } from "./validation/parse";
import { idSchema, standingsQuerySchema } from "./validation/queries";

export type SeasonWithLeagues = Season & { leagues: League[] };
export type LeagueWithSeason = League & { season: Season };

export const getActiveSeason = cache(async function getActiveSeason(): Promise<SeasonWithLeagues> {
  const season = await prisma.season.findFirst({
    where: { active: true },
    include: { leagues: { orderBy: { createdAt: "asc" } } },
  });

  if (!season) {
    throw new NotFoundError("Nema aktivne sezone");
  }

  return season;
});

export const getOurTeam = cache(async function getOurTeam(): Promise<Team> {
  const team = await prisma.team.findFirst({ where: { isOurTeam: true } });
  if (!team) {
    throw new NotFoundError("Naš tim nije pronađen");
  }
  return team;
});

const loadSeasonById = cache(async function loadSeasonById(seasonId: string): Promise<SeasonWithLeagues> {
  parseOrThrow(idSchema, seasonId);
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { leagues: { orderBy: { createdAt: "asc" } } },
  });

  if (!season) {
    throw new NotFoundError("Sezona nije pronađena");
  }

  return season;
});

export async function resolveSeason(seasonId?: string): Promise<SeasonWithLeagues> {
  if (!seasonId) {
    return getActiveSeason();
  }
  return loadSeasonById(seasonId);
}

const loadLeagueById = cache(async function loadLeagueById(leagueId: string): Promise<LeagueWithSeason> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { season: true },
  });
  if (!league) {
    throw new NotFoundError("Liga nije pronađena");
  }
  return league;
});

const loadLeagueForSeason = cache(async function loadLeagueForSeason(seasonId: string): Promise<LeagueWithSeason> {
  const season = await resolveSeason(seasonId || undefined);
  const league = season.leagues[0];
  if (!league) {
    throw new NotFoundError("Liga nije pronađena za sezonu");
  }
  return { ...league, season };
});

export async function resolveLeague(options?: {
  seasonId?: string;
  leagueId?: string;
}): Promise<LeagueWithSeason> {
  const query = parseOrThrow(standingsQuerySchema, options ?? {});

  if (query.leagueId) {
    return loadLeagueById(query.leagueId);
  }

  return loadLeagueForSeason(query.seasonId ?? "");
}
