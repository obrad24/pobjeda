import {
  fetchLeaguePage,
  fetchRoundPage,
  getLeagueId,
  getLeagueUrl,
  mapInBatches,
} from "./client";
import { parseGames, parseLeagueMeta, parseStandings, teamsByTableIndex } from "./parser";
import type { SportDcMatch } from "./types";

export async function getMatches(html?: string): Promise<SportDcMatch[]> {
  const url = getLeagueUrl();
  const leagueHtml = html ?? (await fetchLeaguePage(url));
  const meta = parseLeagueMeta(leagueHtml, url, getLeagueId());
  const indexes = teamsByTableIndex(parseStandings(leagueHtml));
  const byId = new Map<number, SportDcMatch>();

  for (const match of parseGames(leagueHtml, indexes, meta.currentRound)) {
    byId.set(match.sportdcMatchId, match);
  }

  if (html) {
    return [...byId.values()].sort((a, b) => a.round - b.round || a.date.getTime() - b.date.getTime());
  }

  const otherRounds = Array.from({ length: meta.totalRounds }, (_, i) => i + 1).filter(
    (round) => round !== meta.currentRound,
  );

  const pages = await mapInBatches(otherRounds, 4, async (round) => {
    const page = await fetchRoundPage(round, url);
    return { round, page };
  });

  for (const { round, page } of pages) {
    for (const match of parseGames(page, indexes, round)) {
      byId.set(match.sportdcMatchId, match);
    }
  }

  return [...byId.values()].sort((a, b) => a.round - b.round || a.date.getTime() - b.date.getTime());
}

export async function getUpcomingMatches(html?: string): Promise<SportDcMatch[]> {
  const matches = await getMatches(html);
  return matches.filter((match) => match.status === "SCHEDULED");
}

export async function getCompletedMatches(html?: string): Promise<SportDcMatch[]> {
  const matches = await getMatches(html);
  return matches.filter((match) => match.status === "FINISHED");
}
