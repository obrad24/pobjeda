import type { CardType, Position } from "../../generated/prisma";

export const FANTASY_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export type FantasyPosition = (typeof FANTASY_POSITIONS)[number];

export const FANTASY_RULE_KEYS = [
  "appearance",
  "goal_gk",
  "goal_def",
  "goal_mid",
  "goal_fwd",
  "assist",
  "clean_sheet_gk",
  "clean_sheet_def",
  "clean_sheet_mid",
  "clean_sheet_fwd",
  "penalty_miss",
  "yellow_card",
  "red_card",
  "own_goal",
  "save",
  "penalty_save",
] as const;

export type FantasyRuleKey = (typeof FANTASY_RULE_KEYS)[number];

export type ScoringRules = Record<FantasyRuleKey, number>;

export type FantasyBreakdown = {
  appearance: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  yellowCard: number;
  redCard: number;
  ownGoal: number;
  penaltyMiss: number;
  saves: number;
  penaltySave: number;
  total: number;
};

export type PlayerMatchFantasyInput = {
  playerId: string;
  position: Position;
  minutes: number;
  starter: boolean;
  enteredAt: number | null;
  substitutedAt: number | null;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  secondYellow: boolean;
  penaltyMisses: number;
  saves: number;
  penaltySaves: number;
};

export type MatchFantasyContext = {
  goalsAgainst: number;
  concededMinutes: number[];
};

export type MatchPlayerPoints = {
  playerId: string;
  position: FantasyPosition;
  points: number;
  breakdown: FantasyBreakdown;
};

export type MatchFantasySource = {
  goalsAgainst: number;
  concededMinutes: number[];
  lineups: Array<{
    playerId: string;
    position: Position;
    minutes: number | null;
    starter: boolean;
    enteredAt: number | null;
    substitutedAt: number | null;
    saves: number;
    penaltySaves: number;
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
  }>;
  goals: Array<{
    playerId: string;
    assistPlayerId: string | null;
    ownGoal: boolean;
  }>;
  cards: Array<{
    playerId: string;
    type: CardType | "YELLOW" | "RED" | "SECOND_YELLOW";
  }>;
  penaltyMisses: Array<{
    playerId: string;
  }>;
};

export const CLEAN_SHEET_MINUTES = 60;
export const FULL_MATCH_MINUTES = 90;
export const SAVES_PER_POINT = 3;

export const FANTASY_SORTS = ["points", "average", "goals", "assists", "appearances"] as const;
export type FantasySort = (typeof FANTASY_SORTS)[number];
