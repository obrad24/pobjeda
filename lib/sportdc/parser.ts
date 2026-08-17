import * as cheerio from "cheerio";
import type {
  SportDcLeagueMeta,
  SportDcMatch,
  SportDcMatchStatus,
  SportDcStanding,
} from "./types";

function text(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseSignedInt(value: string): number {
  const cleaned = value.replace(/[^\d+-]/g, "");
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIndex(style: string | undefined): number | null {
  if (!style) {
    return null;
  }
  const match = style.match(/--index:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function parseJsonLd($row: {
  find: (selector: string) => { first: () => { text: () => string } };
}): {
  startDate?: string;
  stadium?: string;
} {
  const raw = $row.find('script[type="application/ld+json"]').first().text();
  if (!raw.trim()) {
    return {};
  }

  try {
    const data = JSON.parse(raw) as {
      startDate?: string;
      location?: { name?: string; address?: { addressLocality?: string } };
    };
    return {
      startDate: data.startDate,
      stadium: data.location?.name ?? data.location?.address?.addressLocality,
    };
  } catch {
    return {};
  }
}

function parseClock(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDottedDate(value: string, time: string | null): Date | null {
  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const [hours, minutes] = (time ?? "00:00").split(":");
  return new Date(
    `${year}-${month}-${day}T${hours.padStart(2, "0")}:${(minutes ?? "00").padStart(2, "0")}:00+02:00`,
  );
}

function estimatedKickoff(round: number): Date {
  const firstRound = Date.parse("2026-08-23T17:30:00+02:00");
  return new Date(firstRound + (Math.max(round, 1) - 1) * 7 * 24 * 60 * 60 * 1000);
}

export function parseLeagueMeta(
  html: string,
  fallbackUrl: string,
  fallbackLeagueId: number,
): SportDcLeagueMeta {
  const $ = cheerio.load(html);
  const $table = $("table.ssnet-table[layout='standings']").first();
  const sportdcLeagueId = Number($table.attr("league")) || fallbackLeagueId;
  const currentRound = Number($table.attr("round")) || 1;

  const roundIds = [...html.matchAll(/switchRound\((\d+)\)/g)].map((match) =>
    Number(match[1]),
  );
  const totalRounds = roundIds.length > 0 ? Math.max(...roundIds) : currentRound;

  const seasonMatch = html.match(/20\d{2}-20\d{2}/);
  const seasonName = seasonMatch?.[0] ?? "2026-2027";

  const title = $("title").text();
  const nameFromTitle = title.includes("Prva Opštinska liga Bijeljina")
    ? "Prva Opštinska liga Bijeljina"
    : $("h1").first().text().trim() || "Prva Opštinska liga Bijeljina";

  return {
    sportdcLeagueId,
    name: nameFromTitle,
    seasonName,
    url: fallbackUrl,
    currentRound,
    totalRounds,
  };
}

export function parseStandings(html: string): SportDcStanding[] {
  const $ = cheerio.load(html);
  const rows: SportDcStanding[] = [];

  $("table.ssnet-table[layout='standings'] tbody tr[data-club-id]").each(
    (tableIndex, el) => {
      const $row = $(el);
      const sportdcTeamId = Number($row.attr("data-club-id"));
      if (!Number.isInteger(sportdcTeamId) || sportdcTeamId <= 0) {
        return;
      }

      const position = parseSignedInt(
        $row.find(".pos-deleg").first().text() || $row.find(".poz").first().text(),
      );
      const sportdcName = text($row.find(".team-name").text());
      const city = text($row.find(".team-city").text()) || null;

      rows.push({
        sportdcTeamId,
        sportdcName,
        city,
        tableIndex,
        position: position || tableIndex + 1,
        played: parseSignedInt($row.find(".col-UTAKM").text()),
        won: parseSignedInt($row.find(".col-POB").text()),
        drawn: parseSignedInt($row.find(".col-NER").text()),
        lost: parseSignedInt($row.find(".col-POR").text()),
        goalsFor: parseSignedInt($row.find(".col-DG").text()),
        goalsAgainst: parseSignedInt($row.find(".col-PG").text()),
        goalDiff: parseSignedInt($row.find(".col-GR").text()),
        points: parseSignedInt($row.find(".pts-wrapper").text() || $row.find(".col-BOD").text()),
      });
    },
  );

  return rows;
}

export function parseGames(
  html: string,
  teamsByIndex: number[],
  round: number,
): SportDcMatch[] {
  const $ = cheerio.load(html);
  const matches = new Map<number, SportDcMatch>();

  $(".game-row[data-id]").each((_, el) => {
    const $row = $(el);
    const sportdcMatchId = Number($row.attr("data-id"));
    if (!Number.isInteger(sportdcMatchId) || sportdcMatchId <= 0) {
      return;
    }
    if (matches.has(sportdcMatchId)) {
      return;
    }

    const homeName = text($row.find(".team-host").text());
    const awayName = text($row.find(".team-guest").text());
    const imgIndexes = $row
      .find(".team-img")
      .toArray()
      .map((img) => parseIndex($(img).attr("style")))
      .filter((value): value is number => value !== null);

    const homeTeamId = resolveTeamId(imgIndexes[0], homeName, teamsByIndex, $);
    const awayTeamId = resolveTeamId(imgIndexes[1], awayName, teamsByIndex, $);
    if (!homeTeamId || !awayTeamId) {
      return;
    }

    const jsonLd = parseJsonLd($row);
    const timeText =
      $row
        .find("div")
        .filter((_, node) => /^\d{2}:\d{2}$/.test($(node).text().trim()))
        .first()
        .text()
        .trim() || null;
    const dotted = $row
      .find("div")
      .filter((_, node) => /\d{2}\.\d{2}\.\d{4}/.test($(node).text()))
      .first()
      .text();
    const parsedDate =
      parseClock(jsonLd.startDate) ?? parseDottedDate(dotted, timeText);
    const date = parsedDate ?? estimatedKickoff(round);

    const hostScore = $row.find(".res-host .text-base").first().text().trim();
    const guestScore = $row.find(".res-guest .text-base").first().text().trim();
    const hasScores = hostScore !== "" && guestScore !== "";
    const status: SportDcMatchStatus = hasScores ? "FINISHED" : "SCHEDULED";

    matches.set(sportdcMatchId, {
      sportdcMatchId,
      round,
      date,
      time: timeText || jsonLd.startDate?.slice(11, 16) || null,
      stadium: jsonLd.stadium ?? null,
      homeTeamId,
      awayTeamId,
      homeName,
      awayName,
      status,
      homeScore: hasScores ? Number(hostScore) : null,
      awayScore: hasScores ? Number(guestScore) : null,
    });
  });

  return [...matches.values()];
}

function resolveTeamId(
  index: number | undefined,
  name: string,
  teamsByIndex: number[],
  $: cheerio.CheerioAPI,
): number | null {
  if (index !== undefined && teamsByIndex[index]) {
    return teamsByIndex[index];
  }

  const standings = $("table.ssnet-table[layout='standings'] tbody tr[data-club-id]");
  const unique: number[] = [];
  standings.each((_, el) => {
    const $el = $(el);
    if (text($el.find(".team-name").text()) === name) {
      unique.push(Number($el.attr("data-club-id")));
    }
  });

  return unique.length === 1 ? unique[0] : null;
}

export function teamsByTableIndex(standings: SportDcStanding[]): number[] {
  const ids: number[] = [];
  for (const row of standings) {
    ids[row.tableIndex] = row.sportdcTeamId;
  }
  return ids;
}
