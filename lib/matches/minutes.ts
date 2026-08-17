import type { LineupRowInput } from "../validation/match-stats";

export const FULL_MATCH_MINUTES = 90;

export function resolveMinutes(row: LineupRowInput): number {
  if (row.minutes != null) {
    return row.minutes;
  }

  if (row.starter && row.substitutedAt != null) {
    return row.substitutedAt;
  }
  if (row.starter) {
    return FULL_MATCH_MINUTES;
  }
  if (row.enteredAt != null && row.substitutedAt != null) {
    return Math.max(0, row.substitutedAt - row.enteredAt);
  }
  if (row.enteredAt != null) {
    return Math.max(0, FULL_MATCH_MINUTES - row.enteredAt);
  }
  return 0;
}
