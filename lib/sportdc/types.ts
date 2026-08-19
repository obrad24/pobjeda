export type SportDcMatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type SportDcTeam = {
  sportdcTeamId: number;
  sportdcName: string;
  city: string | null;
  tableIndex: number;
};

export type SportDcStanding = SportDcTeam & {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type SportDcMatch = {
  sportdcMatchId: number;
  round: number;
  date: Date;
  time: string | null;
  stadium: string | null;
  homeTeamId: number;
  awayTeamId: number;
  homeName: string;
  awayName: string;
  status: SportDcMatchStatus;
  homeScore: number | null;
  awayScore: number | null;
};

export type SportDcLeagueMeta = {
  sportdcLeagueId: number;
  name: string;
  seasonName: string;
  url: string;
  currentRound: number;
  totalRounds: number;
};

export type SportDcSnapshot = {
  league: SportDcLeagueMeta;
  standings: SportDcStanding[];
  matches: SportDcMatch[];
};

export type SyncSportDcResult = {
  ok: boolean;
  syncRunId: string;
  status: "SUCCESS" | "ERROR" | "RUNNING";
  errorMessage: string | null;
  warningMessage: string | null;
  teamsUpserted: number;
  matchesUpserted: number;
  standingsUpserted: number;
  roundsFetched: number;
  ourClubId: number;
  pobjedaMatches: number;
};

export const OUR_CLUB_DISPLAY_NAME = "FK Pobjeda Triješnica";
export const OUR_CLUB_LOGO = "/logo.svg";
export const OUR_CLUB_LOGO_PNG = "/logo.png";
export const OUR_CLUB_LOGO_WIDTH = 893;
export const OUR_CLUB_LOGO_HEIGHT = 744;
