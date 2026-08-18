import type { LineupRowInput, MatchSubstitutionInput } from "../validation/match-stats";

export function applySubstitutionsToLineups(
  lineups: LineupRowInput[],
  substitutions: MatchSubstitutionInput[],
): LineupRowInput[] {
  if (substitutions.length === 0) {
    return lineups;
  }

  const next = lineups.map((row) => ({
    ...row,
    enteredAt: null as number | null,
    substitutedAt: null as number | null,
  }));
  const byId = new Map(next.map((row) => [row.playerId, row]));

  for (const sub of substitutions) {
    const leaving = byId.get(sub.playerOutId);
    const entering = byId.get(sub.playerInId);
    if (leaving && sub.minute != null) {
      leaving.substitutedAt = sub.minute;
    }
    if (entering) {
      entering.starter = false;
      if (sub.minute != null) {
        entering.enteredAt = sub.minute;
      }
    }
  }

  return next;
}
