import type { FantasyBreakdown } from "./types";

export const BREAKDOWN_ROWS: Array<{ key: keyof Omit<FantasyBreakdown, "total">; label: string }> = [
  { key: "appearance", label: "Nastup" },
  { key: "goals", label: "Gol" },
  { key: "assists", label: "Asistencija" },
  { key: "cleanSheet", label: "Clean sheet" },
  { key: "saves", label: "Odbrane" },
  { key: "penaltySave", label: "Odbranjen penal" },
  { key: "yellowCard", label: "Žuti karton" },
  { key: "redCard", label: "Crveni karton" },
  { key: "ownGoal", label: "Autogol" },
  { key: "penaltyMiss", label: "Promašen penal" },
];

export function formatSignedPoints(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}
