import { cache } from "react";
import type { LeagueWithSeason } from "../context";
import { resolveLeague } from "../context";
import { prisma } from "../db/prisma";
import { getMatches, type MatchListItem } from "../matches/service";
import { parseOrThrow } from "../validation/parse";
import { matchListQuerySchema, type MatchListQuery } from "../validation/queries";

export type RoundFixtures = {
  round: number;
  matches: MatchListItem[];
};

export type ScheduleResult = {
  league: LeagueWithSeason;
  rounds: RoundFixtures[];
  matches: MatchListItem[];
};

export function groupMatchesByRound(matches: MatchListItem[]): RoundFixtures[] {
  const grouped = new Map<number, MatchListItem[]>();

  for (const match of matches) {
    const list = grouped.get(match.round) ?? [];
    list.push(match);
    grouped.set(match.round, list);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => ({ round, matches: roundMatches }));
}

const loadScheduleForLeague = cache(async function loadScheduleForLeague(
  leagueId: string,
  seasonId: string,
  includeFriendlies: string,
  ourTeamOnly: string,
): Promise<MatchListItem[]> {
  return getMatches({
    leagueId,
    seasonId,
    includeFriendlies: includeFriendlies === "1",
    ourTeamOnly: ourTeamOnly === "1",
  });
});

export async function getSchedule(options?: MatchListQuery): Promise<ScheduleResult> {
  const query = parseOrThrow(matchListQuerySchema, options ?? {});
  const league = await resolveLeague(query);
  const matches = await loadScheduleForLeague(
    league.id,
    league.seasonId,
    (query.includeFriendlies ?? false) ? "1" : "0",
    (query.ourTeamOnly ?? false) ? "1" : "0",
  );

  return {
    league,
    matches,
    rounds: groupMatchesByRound(matches),
  };
}

export const getRoundNumbers = cache(async function getRoundNumbers(): Promise<number[]> {
  const league = await resolveLeague();
  const rows = await prisma.match.findMany({
    where: { leagueId: league.id, round: { gt: 0 } },
    distinct: ["round"],
    select: { round: true },
    orderBy: { round: "asc" },
  });
  return rows.map((row) => row.round);
});

export async function getResults(options?: MatchListQuery): Promise<ScheduleResult> {
  const query = parseOrThrow(matchListQuerySchema, options ?? {});
  const league = await resolveLeague(query);
  const matches = await getMatches({
    ...query,
    leagueId: league.id,
    seasonId: league.seasonId,
    includeFriendlies: query.includeFriendlies ?? false,
    ourTeamOnly: query.ourTeamOnly ?? false,
    status: "FINISHED",
  });

  return {
    league,
    matches,
    rounds: groupMatchesByRound(matches),
  };
}
