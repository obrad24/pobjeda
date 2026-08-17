import { fetchLeaguePage } from "./client";
import { parseStandings } from "./parser";
import type { SportDcStanding } from "./types";

export async function getStandings(html?: string): Promise<SportDcStanding[]> {
  const page = html ?? (await fetchLeaguePage());
  return parseStandings(page);
}
