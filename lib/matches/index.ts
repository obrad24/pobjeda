export {
  getMatch,
  getMatchBySportDcId,
  getMatches,
  getMatchesByRound,
  getRecentMatches,
  getUpcomingMatches,
} from "./service";
export { resolveMinutes } from "./minutes";
export { applySubstitutionsToLineups } from "./substitutions";
export { saveMatchEvents, saveMatchLineup, saveMatchStatistics } from "./statistics";
export { ourEnteredGoalsMismatch } from "./score-warning";
export type { MatchDetail, MatchListItem } from "./service";
