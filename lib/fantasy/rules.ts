import type { FantasyRuleKey, ScoringRules } from "./types";
import { FANTASY_RULE_KEYS } from "./types";

export const DEFAULT_SCORING_RULES: Array<{
  key: FantasyRuleKey;
  name: string;
  points: number;
}> = [
  { key: "appearance", name: "Nastup", points: 2 },
  { key: "goal_gk", name: "Gol — golman", points: 8 },
  { key: "goal_def", name: "Gol — odbrana", points: 6 },
  { key: "goal_mid", name: "Gol — vezni", points: 5 },
  { key: "goal_fwd", name: "Gol — napadač", points: 5 },
  { key: "assist", name: "Asistencija", points: 4 },
  { key: "clean_sheet_gk", name: "Clean sheet — golman", points: 4 },
  { key: "clean_sheet_def", name: "Clean sheet — odbrana", points: 4 },
  { key: "clean_sheet_mid", name: "Clean sheet — vezni", points: 2 },
  { key: "clean_sheet_fwd", name: "Clean sheet — napadač", points: 0 },
  { key: "penalty_miss", name: "Promašen penal", points: -2 },
  { key: "yellow_card", name: "Žuti karton", points: -1 },
  { key: "red_card", name: "Crveni karton", points: -3 },
  { key: "own_goal", name: "Autogol", points: -2 },
  { key: "save", name: "Odbrane (svake 3)", points: 1 },
  { key: "penalty_save", name: "Odbranjen penal", points: 5 },
];

export const DEFAULT_SCORING_POINTS: ScoringRules = Object.fromEntries(
  DEFAULT_SCORING_RULES.map((rule) => [rule.key, rule.points]),
) as ScoringRules;

export function rulesFromRows(
  rows: Array<{ key: string; points: number; active: boolean }>,
): ScoringRules {
  const next: ScoringRules = { ...DEFAULT_SCORING_POINTS };
  for (const key of FANTASY_RULE_KEYS) {
    const row = rows.find((item) => item.key === key && item.active);
    if (row) {
      next[key] = row.points;
    }
  }
  return next;
}

export function rulePoints(rules: ScoringRules, key: FantasyRuleKey): number {
  return rules[key] ?? 0;
}
