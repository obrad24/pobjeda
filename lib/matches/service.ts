import { cache } from "react";
import { Prisma } from "../../generated/prisma";
import { getOurTeam, resolveLeague } from "../context";
import { prisma } from "../db/prisma";
import { NotFoundError } from "../errors";
import { parseOrThrow } from "../validation/parse";
import { idSchema, matchListQuerySchema, type MatchListQuery } from "../validation/queries";

export const matchListInclude = {
  homeTeam: true,
  awayTeam: true,
  season: { select: { id: true, name: true } },
  league: { select: { id: true, name: true } },
} satisfies Prisma.MatchInclude;

export const matchDetailInclude = {
  ...matchListInclude,
  lineups: {
    include: { player: true },
    orderBy: [{ starter: "desc" }, { minutes: "desc" }],
  },
  goals: {
    include: { player: true, assistPlayer: true },
    orderBy: { minute: "asc" },
  },
  cards: {
    include: { player: true },
    orderBy: { minute: "asc" },
  },
  penaltyMisses: {
    include: { player: true },
    orderBy: { minute: "asc" },
  },
  concededGoals: {
    orderBy: { minute: "asc" },
  },
  substitutions: {
    include: { playerOut: true, playerIn: true },
    orderBy: [{ sortOrder: "asc" }, { minute: "asc" }],
  },
} satisfies Prisma.MatchInclude;

export type MatchListItem = Prisma.MatchGetPayload<{ include: typeof matchListInclude }>;
export type MatchDetail = Prisma.MatchGetPayload<{ include: typeof matchDetailInclude }>;

async function matchWhere(options: MatchListQuery): Promise<Prisma.MatchWhereInput> {
  const league = await resolveLeague(options);
  const where: Prisma.MatchWhereInput = {
    seasonId: league.seasonId,
    leagueId: league.id,
  };

  if (options.status) {
    where.status = options.status;
  }
  if (options.round !== undefined) {
    where.round = options.round;
  } else if (!options.includeFriendlies) {
    where.round = { gt: 0 };
  }
  if (options.ourTeamOnly) {
    const team = await getOurTeam();
    where.OR = [{ homeTeamId: team.id }, { awayTeamId: team.id }];
  }

  return where;
}

export async function getMatches(options?: MatchListQuery): Promise<MatchListItem[]> {
  const query = parseOrThrow(matchListQuerySchema, options ?? {});
  const where = await matchWhere({
    ...query,
    includeFriendlies: query.includeFriendlies ?? true,
  });

  return prisma.match.findMany({
    where,
    include: matchListInclude,
    orderBy: [{ date: "asc" }, { round: "asc" }],
    take: query.limit,
  });
}

export const getMatch = cache(async function getMatch(id: string): Promise<MatchDetail> {
  const matchId = parseOrThrow(idSchema, id);
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: matchDetailInclude,
  });

  if (!match) {
    throw new NotFoundError("Utakmica nije pronađena");
  }

  return match;
});

export async function getMatchBySportDcId(sportdcMatchId: number): Promise<MatchDetail> {
  if (!Number.isInteger(sportdcMatchId) || sportdcMatchId <= 0) {
    throw new NotFoundError("Utakmica nije pronađena");
  }

  const match = await prisma.match.findUnique({
    where: { sportdcMatchId },
    include: matchDetailInclude,
  });

  if (!match) {
    throw new NotFoundError("Utakmica nije pronađena");
  }

  return match;
}

export async function getUpcomingMatches(options?: MatchListQuery): Promise<MatchListItem[]> {
  const query = parseOrThrow(matchListQuerySchema, options ?? {});

  return prisma.match.findMany({
    where: await matchWhere({
      ...query,
      ourTeamOnly: query.ourTeamOnly ?? true,
      includeFriendlies: query.includeFriendlies ?? true,
      status: "SCHEDULED",
    }),
    include: matchListInclude,
    orderBy: [{ date: "asc" }, { round: "asc" }],
    take: query.limit ?? 10,
  });
}

export async function getRecentMatches(options?: MatchListQuery): Promise<MatchListItem[]> {
  const query = parseOrThrow(matchListQuerySchema, options ?? {});

  return prisma.match.findMany({
    where: await matchWhere({
      ...query,
      ourTeamOnly: query.ourTeamOnly ?? true,
      includeFriendlies: query.includeFriendlies ?? true,
      status: "FINISHED",
    }),
    include: matchListInclude,
    orderBy: [{ date: "desc" }, { round: "desc" }],
    take: query.limit ?? 3,
  });
}

export async function getMatchesByRound(
  round: number,
  options?: Omit<MatchListQuery, "round">,
): Promise<MatchListItem[]> {
  const query = parseOrThrow(matchListQuerySchema, { ...options, round });
  const where = await matchWhere({
    ...query,
    ourTeamOnly: query.ourTeamOnly ?? false,
    includeFriendlies: query.round === 0 ? true : (query.includeFriendlies ?? false),
  });

  return prisma.match.findMany({
    where,
    include: matchListInclude,
    orderBy: [{ date: "asc" }, { sportdcMatchId: "asc" }],
  });
}
