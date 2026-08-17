import { fetchLeaguePage, getLeagueId, getLeagueUrl } from "./client";
import { parseLeagueMeta } from "./parser";
import type { SportDcLeagueMeta } from "./types";

export async function getLeague(html?: string): Promise<SportDcLeagueMeta> {
  const url = getLeagueUrl();
  const page = html ?? (await fetchLeaguePage(url));
  return parseLeagueMeta(page, url, getLeagueId());
}
