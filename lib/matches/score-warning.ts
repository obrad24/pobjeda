export function ourEnteredGoalsMismatch(
  match: {
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeamId: string;
    awayTeamId: string;
    goals: Array<{ ownGoal?: boolean }>;
    lineups: unknown[];
  },
  ourTeamId: string,
): string | null {
  if (match.status !== "FINISHED" || match.homeScore == null || match.awayScore == null) {
    return null;
  }
  if (match.lineups.length === 0 && match.goals.length === 0) {
    return null;
  }

  const ourScore = match.homeTeamId === ourTeamId ? match.homeScore : match.awayScore;
  const entered = match.goals.filter((goal) => !goal.ownGoal).length;
  if (entered === 0) {
    return `Rezultat za nas je ${ourScore}. Individualna statistika golova još nije unesena — provjerite sastav ako treba.`;
  }
  if (entered !== ourScore) {
    return `Rezultat za nas je ${ourScore}, a uneseno je ${entered} golova. Provjerite individualnu statistiku.`;
  }
  return null;
}

export function formatScoreDriftWarning(input: {
  sportdcMatchId: number;
  previous: string;
  next: string;
}): string {
  return `Utakmica ${input.sportdcMatchId}: rezultat ${input.previous} → ${input.next}. Provjerite sastav i statistiku igrača.`;
}
