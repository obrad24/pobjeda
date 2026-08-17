import type { Position } from "../../generated/prisma";
import type { FantasyPosition, FantasyRuleKey, ScoringRules } from "./types";
import { rulePoints } from "./rules";

export function toFantasyPosition(position: Position): FantasyPosition {
  switch (position) {
    case "GK":
      return "GK";
    case "DF":
      return "DEF";
    case "MF":
    case "WG":
      return "MID";
    case "FW":
      return "FWD";
    default: {
      const exhaustive: never = position;
      return exhaustive;
    }
  }
}

export function fantasyPositionLabel(position: FantasyPosition): string {
  switch (position) {
    case "GK":
      return "Golman";
    case "DEF":
      return "Odbrana";
    case "MID":
      return "Vezni";
    case "FWD":
      return "Napadač";
    default: {
      const exhaustive: never = position;
      return exhaustive;
    }
  }
}

export function goalRuleKey(position: FantasyPosition): FantasyRuleKey {
  switch (position) {
    case "GK":
      return "goal_gk";
    case "DEF":
      return "goal_def";
    case "MID":
      return "goal_mid";
    case "FWD":
      return "goal_fwd";
    default: {
      const exhaustive: never = position;
      return exhaustive;
    }
  }
}

export function cleanSheetRuleKey(position: FantasyPosition): FantasyRuleKey {
  switch (position) {
    case "GK":
      return "clean_sheet_gk";
    case "DEF":
      return "clean_sheet_def";
    case "MID":
      return "clean_sheet_mid";
    case "FWD":
      return "clean_sheet_fwd";
    default: {
      const exhaustive: never = position;
      return exhaustive;
    }
  }
}

export function goalPoints(rules: ScoringRules, position: FantasyPosition, goals: number): number {
  return goals * rulePoints(rules, goalRuleKey(position));
}

export function cleanSheetPoints(rules: ScoringRules, position: FantasyPosition): number {
  return rulePoints(rules, cleanSheetRuleKey(position));
}
