import { fetchLeaguePage, getOurClubId } from "./client";
import { parseStandings } from "./parser";
import { OUR_CLUB_DISPLAY_NAME, OUR_CLUB_LOGO, type SportDcTeam } from "./types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sportdcClubLogoUrl(sportdcTeamId: number): string {
  return `https://sportdc.net/img/club/${sportdcTeamId}`;
}

export function logoUrlForTeam(team: {
  sportdcTeamId: number;
  sportdcName: string;
  city?: string | null;
}): string {
  if (isOurClub(team)) {
    return OUR_CLUB_LOGO;
  }
  return sportdcClubLogoUrl(team.sportdcTeamId);
}

export function crestSrcForTeam(name: string, logo?: string | null): string | null {
  if (name === OUR_CLUB_DISPLAY_NAME) {
    return OUR_CLUB_LOGO;
  }
  return logo ?? null;
}

export function isOurClub(team: {
  sportdcTeamId: number;
  sportdcName: string;
  city?: string | null;
}): boolean {
  if (team.sportdcTeamId === getOurClubId()) {
    return true;
  }

  const haystack = normalize(`${team.sportdcName} ${team.city ?? ""}`);
  return haystack.includes("pobjeda") && haystack.includes("trijesnica");
}

export function displayNameForTeam(team: {
  sportdcTeamId: number;
  sportdcName: string;
  city?: string | null;
}): string {
  if (isOurClub(team)) {
    return OUR_CLUB_DISPLAY_NAME;
  }
  return team.sportdcName;
}

export async function getTeams(html?: string): Promise<SportDcTeam[]> {
  const page = html ?? (await fetchLeaguePage());
  return parseStandings(page).map((row) => ({
    sportdcTeamId: row.sportdcTeamId,
    sportdcName: row.sportdcName,
    city: row.city,
    tableIndex: row.tableIndex,
  }));
}
