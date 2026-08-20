import type { Position } from "../generated/prisma";
import type { MatchListItem } from "./matches";

const SARAJEVO = "Europe/Sarajevo";

export function formatMatchDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SARAJEVO,
  }).format(d);
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SARAJEVO,
  }).format(date);
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: SARAJEVO,
  }).format(d);
}

export function formatMatchTime(date: Date | string | null | undefined, time?: string | null): string {
  if (time) {
    return time;
  }
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("sr-Latn-BA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SARAJEVO,
  }).format(d);
}

export const POSITIONS = [
  { id: "GK", label: "Golman" },
  { id: "DF", label: "Odbrana" },
  { id: "MF", label: "Vezni" },
  { id: "WG", label: "Krilo" },
  { id: "FW", label: "Napadač" },
] as const;

export type PositionId = (typeof POSITIONS)[number]["id"];

export const POSITION_ORDER: PositionId[] = POSITIONS.map((item) => item.id);

export function positionLabel(position: Position | string): string {
  return POSITIONS.find((item) => item.id === position)?.label ?? position;
}

export function cardLabel(type: "YELLOW" | "RED" | "SECOND_YELLOW"): string {
  switch (type) {
    case "YELLOW":
      return "Žuti karton";
    case "RED":
      return "Crveni karton";
    case "SECOND_YELLOW":
      return "Drugi žuti";
    default:
      return type;
  }
}

export function teamInitials(name: string): string {
  const parts = name.replace(/^FK\s+|^OFK\s+/i, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "FK";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function isOurMatch(match: MatchListItem, ourTeamId: string): boolean {
  return match.homeTeamId === ourTeamId || match.awayTeamId === ourTeamId;
}

export function opponentOf(match: MatchListItem, ourTeamId: string) {
  return match.homeTeamId === ourTeamId ? match.awayTeam : match.homeTeam;
}

export function isHomeGame(match: MatchListItem, ourTeamId: string): boolean {
  return match.homeTeamId === ourTeamId;
}

export type OurResult = "win" | "draw" | "loss";

export function resultForUs(match: MatchListItem, ourTeamId: string): OurResult | null {
  if (match.status !== "FINISHED" || match.homeScore == null || match.awayScore == null) {
    return null;
  }

  const ours = match.homeTeamId === ourTeamId ? match.homeScore : match.awayScore;
  const theirs = match.homeTeamId === ourTeamId ? match.awayScore : match.homeScore;
  if (ours > theirs) return "win";
  if (ours < theirs) return "loss";
  return "draw";
}

export function scoreLabel(match: Pick<MatchListItem, "homeScore" | "awayScore" | "status">): string {
  if (match.status !== "FINISHED" || match.homeScore == null || match.awayScore == null) {
    return "vs";
  }
  return `${match.homeScore} : ${match.awayScore}`;
}

export function roundLabel(round: number): string {
  if (round <= 0) {
    return "Prijateljska";
  }
  return `${round}. kolo`;
}

export function seasonLabel(name: string): string {
  const match = name.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) {
    return name;
  }
  const start = match[1];
  const end = match[2].length === 2 ? match[2] : match[2].slice(2);
  return `${start}/${end}`;
}

export function playerFullName(player: { firstName: string; lastName: string }): string {
  return `${player.firstName} ${player.lastName}`;
}

export function formatPriceKm(value: number): string {
  return `${new Intl.NumberFormat("sr-Latn-BA", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)} KM`;
}
