import { cache } from "react";
import type { Player } from "../../generated/prisma";
import { resolveSeason } from "../context";
import { prisma } from "../db/prisma";
import { getPlayer } from "../players/service";
import { parseOrThrow } from "../validation/parse";
import { playerIdSchema } from "../validation/player";
import { statsQuerySchema, type StatsQuery } from "../validation/queries";
import {
  aggregateSeasonStats,
  sortByMetric,
  type PlayerSeasonTotals,
} from "./aggregate";

export type PlayerSeasonStats = PlayerSeasonTotals & {
  player: Player;
  hasData: boolean;
};

export type LeaderboardRow = PlayerSeasonStats;

async function loadSeasonAppearances(seasonId: string) {
  const appearances = await prisma.matchPlayer.findMany({
    where: { match: { seasonId } },
    include: { player: true },
  });

  const matchIds = [...new Set(appearances.map((row) => row.matchId))];
  const [goals, cards] = matchIds.length
    ? await Promise.all([
        prisma.matchGoal.findMany({ where: { matchId: { in: matchIds } } }),
        prisma.matchCard.findMany({ where: { matchId: { in: matchIds } } }),
      ])
    : [[], []];

  return { appearances, goals, cards };
}

function toRows(
  appearances: Awaited<ReturnType<typeof loadSeasonAppearances>>["appearances"],
  totals: Map<string, PlayerSeasonTotals>,
): PlayerSeasonStats[] {
  const players = new Map(appearances.map((row) => [row.playerId, row.player]));

  return [...totals.values()].map((row) => {
    const player = players.get(row.playerId);
    if (!player) {
      throw new Error(`Player ${row.playerId} missing from appearances`);
    }
    return {
      ...row,
      player,
      hasData: row.appearances > 0,
    };
  });
}

const getSeasonStatsById = cache(async function getSeasonStatsById(seasonId: string): Promise<PlayerSeasonStats[]> {
  const { appearances, goals, cards } = await loadSeasonAppearances(seasonId);
  const totals = aggregateSeasonStats(appearances, goals, cards);
  return toRows(appearances, totals);
});

export async function getSeasonPlayerStatistics(options?: StatsQuery): Promise<PlayerSeasonStats[]> {
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const season = await resolveSeason(query.seasonId);
  return getSeasonStatsById(season.id);
}

export async function getPlayerStatistics(
  playerId: string,
  options?: StatsQuery,
): Promise<PlayerSeasonStats> {
  const id = parseOrThrow(playerIdSchema, playerId);
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const season = await resolveSeason(query.seasonId);
  const player = await getPlayer(id);

  const appearances = await prisma.matchPlayer.findMany({
    where: { playerId: id, match: { seasonId: season.id } },
    include: { player: true },
  });
  const matchIds = [...new Set(appearances.map((row) => row.matchId))];
  const [goals, cards] = matchIds.length
    ? await Promise.all([
        prisma.matchGoal.findMany({ where: { matchId: { in: matchIds } } }),
        prisma.matchCard.findMany({ where: { matchId: { in: matchIds } } }),
      ])
    : [[], []];

  const totals = aggregateSeasonStats(appearances, goals, cards);
  const row = totals.get(id);

  return {
    playerId: id,
    appearances: row?.appearances ?? 0,
    minutes: row?.minutes ?? 0,
    goals: row?.goals ?? 0,
    assists: row?.assists ?? 0,
    yellowCards: row?.yellowCards ?? 0,
    redCards: row?.redCards ?? 0,
    player,
    hasData: (row?.appearances ?? 0) > 0,
  };
}

function leaderboard(
  rows: PlayerSeasonStats[],
  metric: "goals" | "assists" | "appearances",
  limit: number,
  minValue = 1,
): LeaderboardRow[] {
  return sortByMetric(rows, metric)
    .filter((row) => row[metric] >= minValue)
    .slice(0, limit);
}

export async function getTopScorers(options?: StatsQuery): Promise<LeaderboardRow[]> {
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const rows = await getSeasonPlayerStatistics(query);
  return leaderboard(rows, "goals", query.limit ?? 10);
}

export async function getTopAssists(options?: StatsQuery): Promise<LeaderboardRow[]> {
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const rows = await getSeasonPlayerStatistics(query);
  return leaderboard(rows, "assists", query.limit ?? 10);
}

export async function getTopAppearances(options?: StatsQuery): Promise<LeaderboardRow[]> {
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const rows = await getSeasonPlayerStatistics(query);
  return leaderboard(rows, "appearances", query.limit ?? 10);
}

export async function getPlayerAppearances(playerId: string, options?: StatsQuery) {
  const id = parseOrThrow(playerIdSchema, playerId);
  const query = parseOrThrow(statsQuerySchema, options ?? {});
  const season = await resolveSeason(query.seasonId);

  return prisma.matchPlayer.findMany({
    where: {
      playerId: id,
      match: { seasonId: season.id },
    },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          season: true,
          goals: {
            where: { OR: [{ playerId: id }, { assistPlayerId: id }] },
            include: { player: true, assistPlayer: true },
          },
          cards: { where: { playerId: id } },
        },
      },
    },
    orderBy: { match: { date: "desc" } },
  });
}

/** Ime iz `docs/STATISTICS.md` — svi igrači aktivne (ili date) sezone. */
export function getPlayerSeasonStats(seasonId?: string) {
  return getSeasonPlayerStatistics(seasonId ? { seasonId } : {});
}
