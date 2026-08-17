import {
  CLEAN_SHEET_MINUTES,
  FULL_MATCH_MINUTES,
  SAVES_PER_POINT,
  type FantasyBreakdown,
  type MatchFantasyContext,
  type MatchFantasySource,
  type MatchPlayerPoints,
  type PlayerMatchFantasyInput,
  type ScoringRules,
} from "./types";
import { rulePoints } from "./rules";
import { cleanSheetPoints, goalPoints, toFantasyPosition } from "./scoring";

export function emptyBreakdown(total = 0): FantasyBreakdown {
  return {
    appearance: 0,
    goals: 0,
    assists: 0,
    cleanSheet: 0,
    yellowCard: 0,
    redCard: 0,
    ownGoal: 0,
    penaltyMiss: 0,
    saves: 0,
    penaltySave: 0,
    total,
  };
}

function wasOnPitch(player: PlayerMatchFantasyInput, minute: number): boolean {
  const start = player.starter ? 0 : (player.enteredAt ?? FULL_MATCH_MINUTES);
  const left = player.substitutedAt;
  if (left != null) {
    return minute >= start && minute < left;
  }
  return minute >= start && minute <= FULL_MATCH_MINUTES;
}

function earnsCleanSheet(player: PlayerMatchFantasyInput, context: MatchFantasyContext): boolean {
  if (player.minutes < CLEAN_SHEET_MINUTES) {
    return false;
  }

  const unknownConceded = Math.max(0, context.goalsAgainst - context.concededMinutes.length);
  if (unknownConceded > 0) {
    return false;
  }

  return !context.concededMinutes.some((minute) => wasOnPitch(player, minute));
}

/**
 * Kartoni: žuti −1, crveni −3.
 * Drugi žuti (SECOND_YELLOW) je isključenje: samo crveni, bez dodatnog −1 za taj karton
 * i bez −1 za prethodni žuti u istoj utakmici.
 * Pravi crveni nakon žutog (YELLOW + RED) ostaje −1 + −3.
 */
function cardPoints(
  player: PlayerMatchFantasyInput,
  rules: ScoringRules,
): { yellowCard: number; redCard: number } {
  const yellow = rulePoints(rules, "yellow_card");
  const red = rulePoints(rules, "red_card");

  if (player.secondYellow) {
    return {
      yellowCard: 0,
      redCard: red + Math.max(0, player.redCards) * red,
    };
  }

  return {
    yellowCard: player.yellowCards * yellow,
    redCard: player.redCards * red,
  };
}

export function calculateMatchPlayerPoints(
  player: PlayerMatchFantasyInput,
  context: MatchFantasyContext,
  rules: ScoringRules,
): MatchPlayerPoints {
  const position = toFantasyPosition(player.position);
  const breakdown = emptyBreakdown();

  if (player.minutes <= 0) {
    return { playerId: player.playerId, position, points: 0, breakdown };
  }

  breakdown.appearance = rulePoints(rules, "appearance");
  breakdown.goals = goalPoints(rules, position, player.goals);
  breakdown.assists = player.assists * rulePoints(rules, "assist");
  breakdown.ownGoal = player.ownGoals * rulePoints(rules, "own_goal");
  breakdown.penaltyMiss = player.penaltyMisses * rulePoints(rules, "penalty_miss");

  if (earnsCleanSheet(player, context)) {
    breakdown.cleanSheet = cleanSheetPoints(rules, position);
  }

  const cards = cardPoints(player, rules);
  breakdown.yellowCard = cards.yellowCard;
  breakdown.redCard = cards.redCard;

  if (position === "GK") {
    breakdown.saves = Math.floor(player.saves / SAVES_PER_POINT) * rulePoints(rules, "save");
    breakdown.penaltySave = player.penaltySaves * rulePoints(rules, "penalty_save");
  }

  breakdown.total =
    breakdown.appearance +
    breakdown.goals +
    breakdown.assists +
    breakdown.cleanSheet +
    breakdown.yellowCard +
    breakdown.redCard +
    breakdown.ownGoal +
    breakdown.penaltyMiss +
    breakdown.saves +
    breakdown.penaltySave;

  return {
    playerId: player.playerId,
    position,
    points: breakdown.total,
    breakdown,
  };
}

export function toPlayerMatchInput(source: MatchFantasySource, playerId: string): PlayerMatchFantasyInput | null {
  const row = source.lineups.find((item) => item.playerId === playerId);
  if (!row) {
    return null;
  }

  const scored = source.goals.filter((goal) => !goal.ownGoal);
  const hasGoalEvents = source.goals.length > 0;
  const hasCardEvents = source.cards.length > 0;
  const cards = source.cards.filter((card) => card.playerId === playerId);

  return {
    playerId,
    position: row.position,
    minutes: row.minutes ?? 0,
    starter: row.starter,
    enteredAt: row.enteredAt,
    substitutedAt: row.substitutedAt,
    goals: hasGoalEvents
      ? scored.filter((goal) => goal.playerId === playerId).length
      : (row.goals ?? 0),
    assists: hasGoalEvents
      ? scored.filter((goal) => goal.assistPlayerId === playerId).length
      : (row.assists ?? 0),
    ownGoals: source.goals.filter((goal) => goal.ownGoal && goal.playerId === playerId).length,
    yellowCards: hasCardEvents
      ? cards.filter((card) => card.type === "YELLOW").length
      : (row.yellowCards ?? 0),
    redCards: hasCardEvents
      ? cards.filter((card) => card.type === "RED").length
      : (row.redCards ?? 0),
    secondYellow: hasCardEvents && cards.some((card) => card.type === "SECOND_YELLOW"),
    penaltyMisses: source.penaltyMisses.filter((item) => item.playerId === playerId).length,
    saves: row.saves,
    penaltySaves: row.penaltySaves,
  };
}

export function calculateMatchFantasy(
  source: MatchFantasySource,
  rules: ScoringRules,
): MatchPlayerPoints[] {
  const context: MatchFantasyContext = {
    goalsAgainst: source.goalsAgainst,
    concededMinutes: source.concededMinutes,
  };

  return source.lineups.flatMap((row) => {
    const input = toPlayerMatchInput(source, row.playerId);
    if (!input) {
      return [];
    }
    return [calculateMatchPlayerPoints(input, context, rules)];
  });
}

export function calculatePlayerSeasonPoints(rows: Array<{ points: number }>): number {
  return rows.reduce((sum, row) => sum + row.points, 0);
}

export function calculatePlayerGameweekPoints(rows: Array<{ points: number }>): number {
  return calculatePlayerSeasonPoints(rows);
}
