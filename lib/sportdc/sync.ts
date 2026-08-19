import { MatchStatus } from "../../generated/prisma";
import { prisma } from "../db/prisma";
import {
  fetchLeaguePage,
  fetchRoundPage,
  getLeagueId,
  getLeagueUrl,
  getOurClubId,
  mapInBatches,
} from "./client";
import {
  parseGames,
  parseLeagueMeta,
  parseStandings,
  teamsByTableIndex,
} from "./parser";
import { displayNameForTeam, isOurClub, sportdcClubLogoUrl } from "./teams";
import type {
  SportDcLeagueMeta,
  SportDcMatch,
  SportDcStanding,
  SportDcTeam,
  SyncSportDcResult,
} from "./types";
import { formatScoreDriftWarning } from "../matches/score-warning";

const STALE_LOCK_MS = 2 * 60 * 1000;

export async function getLatestSyncRun() {
  return prisma.syncRun.findFirst({
    orderBy: { startedAt: "desc" },
  });
}

export async function getLatestSuccessfulSync() {
  return prisma.syncRun.findFirst({
    where: { status: "SUCCESS" },
    orderBy: { finishedAt: "desc" },
  });
}

export async function getSyncStatus() {
  const [latest, lastSuccess, lastErrorRun] = await Promise.all([
    getLatestSyncRun(),
    getLatestSuccessfulSync(),
    prisma.syncRun.findFirst({
      where: { status: "ERROR" },
      orderBy: { finishedAt: "desc" },
    }),
  ]);

  return {
    latest,
    lastSuccess,
    lastErrorRun,
    inProgress: latest?.status === "RUNNING",
    lastSyncedAt: lastSuccess?.finishedAt ?? null,
    lastError:
      lastErrorRun?.errorMessage ??
      (latest?.status === "ERROR" ? (latest.errorMessage ?? "Sync nije uspio") : null),
    lastWarning: lastSuccess?.warningMessage ?? latest?.warningMessage ?? null,
  };
}

async function assertNoActiveSync() {
  const running = await prisma.syncRun.findFirst({
    where: { status: "RUNNING" },
    orderBy: { startedAt: "desc" },
  });

  if (!running) {
    return;
  }

  if (Date.now() - running.startedAt.getTime() < STALE_LOCK_MS) {
    const error = new Error("SportDC sync is already running") as Error & {
      code: string;
    };
    error.code = "SYNC_IN_PROGRESS";
    throw error;
  }

  await prisma.syncRun.update({
    where: { id: running.id },
    data: {
      status: "ERROR",
      finishedAt: new Date(),
      errorMessage: "Stale RUNNING lock released",
    },
  });
}

export async function syncLeague(meta: SportDcLeagueMeta) {
  const season = await prisma.season.upsert({
    where: { name: meta.seasonName },
    update: { active: true },
    create: { name: meta.seasonName, active: true },
  });

  await prisma.season.updateMany({
    where: { id: { not: season.id }, active: true },
    data: { active: false },
  });

  const league = await prisma.league.upsert({
    where: {
      seasonId_sportdcLeagueId: {
        seasonId: season.id,
        sportdcLeagueId: meta.sportdcLeagueId,
      },
    },
    update: { name: meta.name, sportdcUrl: meta.url },
    create: {
      name: meta.name,
      seasonId: season.id,
      sportdcLeagueId: meta.sportdcLeagueId,
      sportdcUrl: meta.url,
    },
  });

  return { season, league };
}

export async function syncTeams(teams: SportDcTeam[]) {
  const ourClubId = getOurClubId();
  let count = 0;

  for (const team of teams) {
    const ours = isOurClub(team);
    await prisma.team.upsert({
      where: { sportdcTeamId: team.sportdcTeamId },
      update: {
        sportdcName: team.sportdcName,
        city: team.city,
        logo: sportdcClubLogoUrl(team.sportdcTeamId),
        isOurTeam: ours,
        ...(ours ? { name: displayNameForTeam(team) } : {}),
      },
      create: {
        sportdcTeamId: team.sportdcTeamId,
        sportdcName: team.sportdcName,
        city: team.city,
        logo: sportdcClubLogoUrl(team.sportdcTeamId),
        isOurTeam: ours,
        name: displayNameForTeam(team),
      },
    });
    count += 1;
  }

  await prisma.team.updateMany({
    where: { isOurTeam: true, sportdcTeamId: { not: ourClubId } },
    data: { isOurTeam: false },
  });

  return count;
}

export async function syncStandings(
  leagueId: string,
  standings: SportDcStanding[],
) {
  for (const row of standings) {
    await prisma.leagueStanding.upsert({
      where: {
        leagueId_sportdcTeamId: {
          leagueId,
          sportdcTeamId: row.sportdcTeamId,
        },
      },
      update: {
        position: row.position,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDiff: row.goalDiff,
        points: row.points,
      },
      create: {
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
      },
    });
  }

  if (standings.length >= 10) {
    await prisma.leagueStanding.deleteMany({
      where: {
        leagueId,
        sportdcTeamId: { notIn: standings.map((row) => row.sportdcTeamId) },
      },
    });
  }

  return standings.length;
}

export async function syncMatches(
  seasonId: string,
  leagueId: string,
  matches: SportDcMatch[],
): Promise<{ count: number; warnings: string[] }> {
  const teams = await prisma.team.findMany({
    select: { id: true, sportdcTeamId: true },
  });
  const teamIds = new Map(teams.map((team) => [team.sportdcTeamId, team.id]));
  const existingRows = await prisma.match.findMany({
    where: { sportdcMatchId: { in: matches.map((match) => match.sportdcMatchId) } },
    select: {
      sportdcMatchId: true,
      homeScore: true,
      awayScore: true,
      status: true,
      _count: { select: { lineups: true, goals: true, cards: true } },
    },
  });
  const existingById = new Map(existingRows.map((row) => [row.sportdcMatchId, row]));
  const warnings: string[] = [];
  let count = 0;

  for (const match of matches) {
    const homeTeamId = teamIds.get(match.homeTeamId);
    const awayTeamId = teamIds.get(match.awayTeamId);
    if (!homeTeamId || !awayTeamId) {
      continue;
    }

    const existing = existingById.get(match.sportdcMatchId);
    const hasStats = existing
      ? existing._count.lineups + existing._count.goals + existing._count.cards > 0
      : false;
    const scoreChanged =
      existing &&
      (existing.homeScore !== match.homeScore ||
        existing.awayScore !== match.awayScore ||
        existing.status !== match.status);
    if (existing && hasStats && scoreChanged) {
      warnings.push(
        formatScoreDriftWarning({
          sportdcMatchId: match.sportdcMatchId,
          previous: `${existing.homeScore ?? "–"}:${existing.awayScore ?? "–"} (${existing.status})`,
          next: `${match.homeScore ?? "–"}:${match.awayScore ?? "–"} (${match.status})`,
        }),
      );
    }

    await prisma.match.upsert({
      where: { sportdcMatchId: match.sportdcMatchId },
      update: {
        seasonId,
        leagueId,
        homeTeamId,
        awayTeamId,
        date: match.date,
        time: match.time,
        stadium: match.stadium,
        round: match.round,
        status: match.status as MatchStatus,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      },
      create: {
        seasonId,
        leagueId,
        homeTeamId,
        awayTeamId,
        sportdcMatchId: match.sportdcMatchId,
        date: match.date,
        time: match.time,
        stadium: match.stadium,
        round: match.round,
        status: match.status as MatchStatus,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      },
    });
    count += 1;
  }

  return { count, warnings };
}

export async function syncSportDCLeague(): Promise<SyncSportDcResult> {
  await assertNoActiveSync();

  const run = await prisma.syncRun.create({
    data: { status: "RUNNING", source: "SPORTDC" },
  });

  try {
    const url = getLeagueUrl();
    const leagueHtml = await fetchLeaguePage(url);
    const meta = parseLeagueMeta(leagueHtml, url, getLeagueId());
    const standings = parseStandings(leagueHtml);
    const teams = standings;
    const indexes = teamsByTableIndex(standings);

    if (teams.length === 0) {
      throw new Error("SportDC parser returned 0 teams — refusing to write");
    }

    const { season, league } = await syncLeague(meta);
    const teamsUpserted = await syncTeams(teams);
    const standingsUpserted = await syncStandings(league.id, standings);

    const byId = new Map<number, SportDcMatch>();
    for (const match of parseGames(leagueHtml, indexes, meta.currentRound)) {
      byId.set(match.sportdcMatchId, match);
    }

    const otherRounds = Array.from({ length: meta.totalRounds }, (_, i) => i + 1).filter(
      (round) => round !== meta.currentRound,
    );
    const roundErrors: string[] = [];
    let roundsFetched = 1;

    const pages = await mapInBatches(otherRounds, 4, async (round) => {
      try {
        const page = await fetchRoundPage(round, url);
        return { round, page, error: null as string | null };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { round, page: null, error: message };
      }
    });

    for (const item of pages) {
      if (item.error || !item.page) {
        roundErrors.push(`round ${item.round}: ${item.error}`);
        continue;
      }
      roundsFetched += 1;
      for (const match of parseGames(item.page, indexes, item.round)) {
        byId.set(match.sportdcMatchId, match);
      }
    }

    const { count: matchesUpserted, warnings } = await syncMatches(season.id, league.id, [...byId.values()]);
    const ourClubId = getOurClubId();
    const pobjedaMatches = [...byId.values()].filter(
      (match) => match.homeTeamId === ourClubId || match.awayTeamId === ourClubId,
    ).length;

    const ok = roundErrors.length === 0;
    const errorMessage = roundErrors.length > 0 ? roundErrors.join("; ") : null;
    const warningMessage = warnings.length > 0 ? warnings.join(" ") : null;

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: ok ? "SUCCESS" : "ERROR",
        finishedAt: new Date(),
        errorMessage,
        warningMessage,
        teamsUpserted,
        matchesUpserted,
        standingsUpserted,
        roundsFetched,
      },
    });

    return {
      ok,
      syncRunId: run.id,
      status: ok ? "SUCCESS" : "ERROR",
      errorMessage,
      warningMessage,
      teamsUpserted,
      matchesUpserted,
      standingsUpserted,
      roundsFetched,
      ourClubId,
      pobjedaMatches,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        errorMessage,
      },
    });

    if ((error as { code?: string }).code === "SYNC_IN_PROGRESS") {
      throw error;
    }

    return {
      ok: false,
      syncRunId: run.id,
      status: "ERROR",
      errorMessage,
      warningMessage: null,
      teamsUpserted: 0,
      matchesUpserted: 0,
      standingsUpserted: 0,
      roundsFetched: 0,
      ourClubId: getOurClubId(),
      pobjedaMatches: 0,
    };
  }
}

/** Admin "Sinhronizuj sada" calls the same pipeline. */
export const triggerSportDcSync = syncSportDCLeague;
