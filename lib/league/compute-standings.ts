export type StandingTeam = {
  id: string;
  name: string;
  isOurTeam?: boolean;
  sportdcTeamId?: number;
  city?: string | null;
  logo?: string | null;
};

export type FinishedMatchInput = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type ComputedStandingRow = {
  teamId: string;
  team: StandingTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position: number;
};

function emptyRow(team: StandingTeam): Omit<ComputedStandingRow, "position"> {
  return {
    teamId: team.id,
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function applyResult(
  row: Omit<ComputedStandingRow, "position">,
  goalsFor: number,
  goalsAgainst: number,
) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

function compareRows(
  a: Omit<ComputedStandingRow, "position">,
  b: Omit<ComputedStandingRow, "position">,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.team.name.localeCompare(b.team.name, "sr-Latn");
}

/** 3 boda pobjeda, 1 neriješeno. Sort: bodovi → gol-razlika → dati golovi → ime. */
export function computeStandings(
  matches: FinishedMatchInput[],
  teams: StandingTeam[],
): ComputedStandingRow[] {
  const rows = new Map<string, Omit<ComputedStandingRow, "position">>();

  for (const team of teams) {
    rows.set(team.id, emptyRow(team));
  }

  for (const match of matches) {
    if (match.homeScore == null || match.awayScore == null) {
      continue;
    }

    if (!rows.has(match.homeTeamId)) {
      rows.set(match.homeTeamId, emptyRow({ id: match.homeTeamId, name: match.homeTeamId }));
    }
    if (!rows.has(match.awayTeamId)) {
      rows.set(match.awayTeamId, emptyRow({ id: match.awayTeamId, name: match.awayTeamId }));
    }

    applyResult(rows.get(match.homeTeamId)!, match.homeScore, match.awayScore);
    applyResult(rows.get(match.awayTeamId)!, match.awayScore, match.homeScore);
  }

  return [...rows.values()].sort(compareRows).map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}
