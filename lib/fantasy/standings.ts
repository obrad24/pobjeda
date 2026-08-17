import { cache } from "react";
import type { Player, Season } from "../../generated/prisma";
import { getOurTeam, resolveSeason } from "../context";
import { prisma } from "../db/prisma";
import { parseOrThrow } from "../validation/parse";
import { playerIdSchema } from "../validation/player";
import { idSchema } from "../validation/queries";
import { calculatePlayerSeasonPoints } from "./calculator";
import { toFantasyPosition } from "./scoring";
import { ensureFantasyRules } from "./store";
import { rulesFromRows } from "./rules";
import {
  FANTASY_SORTS,
  type FantasyBreakdown,
  type FantasyPosition,
  type FantasySort,
  type ScoringRules,
} from "./types";

export type FantasyQuery = {
  seasonId?: string;
  round?: number;
  sort?: FantasySort;
};

export type FantasyLeaderboardRow = {
  playerId: string;
  player: Player;
  position: FantasyPosition;
  appearances: number;
  goals: number;
  assists: number;
  points: number;
  average: number;
  form: number[];
  rank: number;
};

export type FantasyGameweekRow = {
  playerId: string;
  player: Player;
  position: FantasyPosition;
  points: number;
  breakdown: FantasyBreakdown;
  matchId: string;
  round: number;
};

export type FantasyHistoryRow = {
  matchId: string;
  round: number;
  date: Date;
  opponentName: string;
  opponentSlugName: string;
  home: boolean;
  points: number;
  breakdown: FantasyBreakdown;
};

const pointsInclude = {
  player: true,
  match: {
    select: {
      id: true,
      round: true,
      date: true,
      status: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: { select: { id: true, name: true, sportdcName: true } },
      awayTeam: { select: { id: true, name: true, sportdcName: true } },
    },
  },
} as const;

function asBreakdown(value: unknown): FantasyBreakdown {
  const row = value as Partial<FantasyBreakdown> | null;
  return {
    appearance: row?.appearance ?? 0,
    goals: row?.goals ?? 0,
    assists: row?.assists ?? 0,
    cleanSheet: row?.cleanSheet ?? 0,
    yellowCard: row?.yellowCard ?? 0,
    redCard: row?.redCard ?? 0,
    ownGoal: row?.ownGoal ?? 0,
    penaltyMiss: row?.penaltyMiss ?? 0,
    saves: row?.saves ?? 0,
    penaltySave: row?.penaltySave ?? 0,
    total: row?.total ?? 0,
  };
}

function parseSort(value: string | undefined): FantasySort {
  return FANTASY_SORTS.includes(value as FantasySort) ? (value as FantasySort) : "points";
}

const loadPointRowsCached = cache(async function loadPointRowsCached(seasonId: string, roundKey: string) {
  const round = roundKey === "*" ? undefined : Number(roundKey);
  const ourTeam = await getOurTeam();
  return prisma.fantasyMatchPoints.findMany({
    where: {
      match: {
        seasonId,
        ...(round != null ? { round } : {}),
        OR: [{ homeTeamId: ourTeam.id }, { awayTeamId: ourTeam.id }],
      },
    },
    include: pointsInclude,
    orderBy: [{ match: { date: "asc" } }, { points: "desc" }],
  });
});

async function loadPointRows(seasonId: string, round?: number) {
  return loadPointRowsCached(seasonId, round == null ? "*" : String(round));
}

function sortRows(rows: FantasyLeaderboardRow[], sort: FantasySort): FantasyLeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (sort === "average") {
      if (b.average !== a.average) return b.average - a.average;
    } else if (b[sort] !== a[sort]) {
      return b[sort] - a[sort];
    }
    if (b.points !== a.points) return b.points - a.points;
    return a.player.lastName.localeCompare(b.player.lastName, "sr-Latn");
  });
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getFantasyLeaderboard(options?: FantasyQuery): Promise<FantasyLeaderboardRow[]> {
  const seasonId = options?.seasonId ? parseOrThrow(idSchema, options.seasonId) : (await resolveSeason()).id;
  const sort = parseSort(options?.sort);
  const rows = await loadPointRows(seasonId, options?.round);
  const matchIds = [...new Set(rows.map((row) => row.matchId))];
  const goals = matchIds.length
    ? await prisma.matchGoal.findMany({
        where: { matchId: { in: matchIds }, ownGoal: false },
      })
    : [];

  const byPlayer = new Map<
    string,
    {
      player: Player;
      points: number[];
      appearances: number;
      goals: number;
      assists: number;
      byRound: Map<number, number>;
    }
  >();

  for (const row of rows) {
    const current = byPlayer.get(row.playerId) ?? {
      player: row.player,
      points: [],
      appearances: 0,
      goals: 0,
      assists: 0,
      byRound: new Map<number, number>(),
    };
    const breakdown = asBreakdown(row.breakdown);
    current.points.push(row.points);
    if (breakdown.appearance > 0) {
      current.appearances += 1;
    }
    current.byRound.set(row.match.round, (current.byRound.get(row.match.round) ?? 0) + row.points);
    byPlayer.set(row.playerId, current);
  }

  for (const goal of goals) {
    const scorer = byPlayer.get(goal.playerId);
    if (scorer) {
      scorer.goals += 1;
    }
    if (goal.assistPlayerId) {
      const assistant = byPlayer.get(goal.assistPlayerId);
      if (assistant) {
        assistant.assists += 1;
      }
    }
  }

  const leaderboard: FantasyLeaderboardRow[] = [...byPlayer.entries()].map(([playerId, row]) => {
    const total = calculatePlayerSeasonPoints(row.points.map((value) => ({ points: value })));
    const rounds = [...row.byRound.entries()].sort((a, b) => a[0] - b[0]);
    return {
      playerId,
      player: row.player,
      position: toFantasyPosition(row.player.position),
      appearances: row.appearances,
      goals: row.goals,
      assists: row.assists,
      points: total,
      average: row.appearances > 0 ? Math.round((total / row.appearances) * 10) / 10 : 0,
      form: rounds.slice(-5).map((item) => item[1]),
      rank: 0,
    };
  });

  return sortRows(
    leaderboard.filter((row) => row.appearances > 0),
    sort,
  );
}

export async function getFantasyGameweekLeaderboard(
  options?: FantasyQuery,
): Promise<FantasyGameweekRow[]> {
  const seasonId = options?.seasonId ? parseOrThrow(idSchema, options.seasonId) : (await resolveSeason()).id;
  if (options?.round == null) {
    return [];
  }
  const rows = await loadPointRows(seasonId, options.round);
  return rows
    .filter((row) => asBreakdown(row.breakdown).appearance > 0)
    .map((row) => ({
      playerId: row.playerId,
      player: row.player,
      position: toFantasyPosition(row.player.position),
      points: row.points,
      breakdown: asBreakdown(row.breakdown),
      matchId: row.matchId,
      round: row.match.round,
    }))
    .sort((a, b) => b.points - a.points || a.player.lastName.localeCompare(b.player.lastName, "sr-Latn"));
}

export async function getFantasyGameweeks(seasonId?: string): Promise<number[]> {
  const season = await resolveSeason(seasonId);
  const ourTeam = await getOurTeam();
  const rounds = await prisma.fantasyMatchPoints.findMany({
    where: {
      match: {
        seasonId: season.id,
        OR: [{ homeTeamId: ourTeam.id }, { awayTeamId: ourTeam.id }],
      },
    },
    select: { match: { select: { round: true } } },
  });
  return [...new Set(rounds.map((row) => row.match.round))].sort((a, b) => a - b);
}

export async function getLatestFantasyGameweek(seasonId?: string): Promise<number | null> {
  const season = await resolveSeason(seasonId);
  const ourTeam = await getOurTeam();
  const latest = await prisma.fantasyMatchPoints.findFirst({
    where: {
      match: {
        seasonId: season.id,
        OR: [{ homeTeamId: ourTeam.id }, { awayTeamId: ourTeam.id }],
      },
    },
    orderBy: [{ match: { date: "desc" } }, { match: { round: "desc" } }],
    select: { match: { select: { round: true } } },
  });
  return latest?.match.round ?? null;
}

export async function getPlayerFantasyProfile(playerId: string, seasonId?: string) {
  const id = parseOrThrow(playerIdSchema, playerId);
  const season = await resolveSeason(seasonId);
  const ourTeam = await getOurTeam();
  const [leaderboard, rows] = await Promise.all([
    getFantasyLeaderboard({ seasonId: season.id }),
    prisma.fantasyMatchPoints.findMany({
      where: {
        playerId: id,
        match: {
          seasonId: season.id,
          OR: [{ homeTeamId: ourTeam.id }, { awayTeamId: ourTeam.id }],
        },
      },
      include: pointsInclude,
      orderBy: [{ match: { date: "asc" } }, { match: { round: "asc" } }],
    }),
  ]);

  const standing = leaderboard.find((row) => row.playerId === id);
  const history: FantasyHistoryRow[] = rows.map((row) => {
    const home = row.match.homeTeamId === ourTeam.id;
    const opponent = home ? row.match.awayTeam : row.match.homeTeam;
    return {
      matchId: row.matchId,
      round: row.match.round,
      date: row.match.date,
      opponentName: opponent.name,
      opponentSlugName: opponent.sportdcName,
      home,
      points: row.points,
      breakdown: asBreakdown(row.breakdown),
    };
  });

  const last = history.at(-1);

  return {
    season,
    total: standing?.points ?? calculatePlayerSeasonPoints(history),
    average: standing?.average ?? 0,
    appearances: standing?.appearances ?? 0,
    lastGameweekPoints: last?.points ?? null,
    rank: standing?.rank ?? null,
    history,
    form: standing?.form ?? history.slice(-5).map((row) => row.points),
  };
}

export async function getFantasySeasons(): Promise<Season[]> {
  return prisma.season.findMany({
    orderBy: [{ startDate: "desc" }, { name: "desc" }],
  });
}

export async function getFantasyAdminOverview(seasonId?: string) {
  const season = await resolveSeason(seasonId);
  const [ruleRows, leaderboard, gameweeks, latestRound] = await Promise.all([
    ensureFantasyRules(season.id),
    getFantasyLeaderboard({ seasonId: season.id }),
    getFantasyGameweeks(season.id),
    getLatestFantasyGameweek(season.id),
  ]);

  const lastGameweek =
    latestRound == null
      ? []
      : await getFantasyGameweekLeaderboard({ seasonId: season.id, round: latestRound });

  return {
    season,
    rules: ruleRows,
    scoring: rulesFromRows(ruleRows),
    leaderboard,
    gameweeks,
    latestRound,
    lastGameweek,
  };
}

export type { ScoringRules };
