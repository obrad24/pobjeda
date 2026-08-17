import { CardType } from "../../generated/prisma";

export type AppearanceRow = {
  playerId: string;
  matchId: string;
  minutes: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

export type GoalEventRow = {
  matchId: string;
  playerId: string;
  assistPlayerId: string | null;
  ownGoal?: boolean;
};

export type CardEventRow = {
  matchId: string;
  playerId: string;
  type: CardType;
};

export type PlayerSeasonTotals = {
  playerId: string;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

function emptyTotals(playerId: string): PlayerSeasonTotals {
  return {
    playerId,
    appearances: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
  };
}

function addCard(totals: PlayerSeasonTotals, type: CardType) {
  if (type === CardType.YELLOW) {
    totals.yellowCards += 1;
    return;
  }
  if (type === CardType.RED) {
    totals.redCards += 1;
    return;
  }
  totals.yellowCards += 1;
  totals.redCards += 1;
}

/**
 * Agregira statistiku iz nastupa. Ako utakmica ima MatchGoal redove,
 * golovi/asistencije se uzimaju odatle; inače iz MatchPlayer brojača.
 * Isto pravilo važi za kartone (MatchCard vs MatchPlayer).
 */
export function aggregateSeasonStats(
  appearances: AppearanceRow[],
  goals: GoalEventRow[],
  cards: CardEventRow[],
): Map<string, PlayerSeasonTotals> {
  const totals = new Map<string, PlayerSeasonTotals>();
  const goalsByMatch = new Map<string, GoalEventRow[]>();
  const cardsByMatch = new Map<string, CardEventRow[]>();

  for (const goal of goals) {
    const list = goalsByMatch.get(goal.matchId) ?? [];
    list.push(goal);
    goalsByMatch.set(goal.matchId, list);
  }

  for (const card of cards) {
    const list = cardsByMatch.get(card.matchId) ?? [];
    list.push(card);
    cardsByMatch.set(card.matchId, list);
  }

  for (const appearance of appearances) {
    const row = totals.get(appearance.playerId) ?? emptyTotals(appearance.playerId);
    row.appearances += 1;
    row.minutes += appearance.minutes ?? 0;

    const matchGoals = goalsByMatch.get(appearance.matchId);
    if (matchGoals && matchGoals.length > 0) {
      row.goals += matchGoals.filter((goal) => goal.playerId === appearance.playerId && !goal.ownGoal).length;
      row.assists += matchGoals.filter(
        (goal) => goal.assistPlayerId === appearance.playerId && !goal.ownGoal,
      ).length;
    } else {
      row.goals += appearance.goals;
      row.assists += appearance.assists;
    }

    const matchCards = cardsByMatch.get(appearance.matchId);
    if (matchCards && matchCards.length > 0) {
      for (const card of matchCards.filter((item) => item.playerId === appearance.playerId)) {
        addCard(row, card.type);
      }
    } else {
      row.yellowCards += appearance.yellowCards;
      row.redCards += appearance.redCards;
    }

    totals.set(appearance.playerId, row);
  }

  return totals;
}

export function sortByMetric<T extends PlayerSeasonTotals>(
  rows: T[],
  metric: "goals" | "assists" | "appearances" | "minutes",
): T[] {
  return [...rows].sort((a, b) => {
    if (b[metric] !== a[metric]) {
      return b[metric] - a[metric];
    }
    if (b.appearances !== a.appearances) {
      return b.appearances - a.appearances;
    }
    return b.minutes - a.minutes;
  });
}
