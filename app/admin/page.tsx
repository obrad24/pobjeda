import Link from "next/link";
import { getActiveSeason, getOurTeam } from "@/lib/context";
import { prisma } from "@/lib/db/prisma";
import {
  formatDateTime,
  formatShortDate,
  opponentOf,
  playerFullName,
  roundLabel,
  scoreLabel,
} from "@/lib/format";
import { getRecentMatches, getUpcomingMatches } from "@/lib/matches";
import { getPlayers } from "@/lib/players";
import { getSyncStatus } from "@/lib/sportdc/sync";
import { getTopScorers } from "@/lib/stats";

export default async function AdminHomePage() {
  const [players, upcoming, recent, scorers, sync, matchCount, season, ourTeam] = await Promise.all([
    getPlayers({ includeInactive: true }),
    getUpcomingMatches({ limit: 1 }),
    getRecentMatches({ limit: 1 }),
    getTopScorers({ limit: 1 }).catch(() => []),
    getSyncStatus(),
    prisma.match.count(),
    getActiveSeason().catch(() => null),
    getOurTeam().catch(() => null),
  ]);

  const activePlayers = players.filter((player) => player.active).length;
  const nextMatch = upcoming[0];
  const lastResult = recent[0];
  const topScorer = scorers[0];
  const ourTeamId = ourTeam?.id ?? null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">Admin</p>
        <h1 className="mt-1 font-display text-3xl text-navy">Pregled</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/igraci" className="rounded-xl border border-navy/10 bg-white p-5 hover:border-gold">
          <p className="text-sm text-muted">Igrači</p>
          <p className="mt-2 font-display text-3xl">{activePlayers}</p>
          <p className="mt-1 text-xs text-muted">{players.length} ukupno u bazi</p>
        </Link>
        <Link href="/admin/utakmice" className="rounded-xl border border-navy/10 bg-white p-5 hover:border-gold">
          <p className="text-sm text-muted">Utakmice</p>
          <p className="mt-2 font-display text-3xl">{matchCount}</p>
          <p className="mt-1 text-xs text-muted">sve u bazi, uključujući ligu</p>
        </Link>
        <Link href="/admin/utakmice?tab=naredne" className="rounded-xl border border-navy/10 bg-white p-5 hover:border-gold">
          <p className="text-sm text-muted">Sljedeća utakmica</p>
          <p className="mt-2 font-display text-lg text-navy">
            {nextMatch && ourTeamId
              ? `${opponentOf(nextMatch, ourTeamId).sportdcName} · ${roundLabel(nextMatch.round)}`
              : "Nema"}
          </p>
          {nextMatch ? <p className="mt-1 text-xs text-muted">{formatShortDate(nextMatch.date)}</p> : null}
        </Link>
        <Link href="/admin/utakmice?tab=odigrane" className="rounded-xl border border-navy/10 bg-white p-5 hover:border-gold">
          <p className="text-sm text-muted">Posljednji rezultat</p>
          <p className="mt-2 font-display text-lg text-navy">
            {lastResult && ourTeamId
              ? `${opponentOf(lastResult, ourTeamId).sportdcName} ${scoreLabel(lastResult)}`
              : "Nema"}
          </p>
        </Link>
        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <p className="text-sm text-muted">Najbolji strijelac</p>
          <p className="mt-2 font-display text-lg text-navy">
            {topScorer ? `${playerFullName(topScorer.player)} (${topScorer.goals})` : "Još nema golova"}
          </p>
        </div>
        <Link href="/admin/sezone" className="rounded-xl border border-navy/10 bg-white p-5 hover:border-gold">
          <p className="text-sm text-muted">Aktivna sezona</p>
          <p className="mt-2 font-display text-lg text-navy">{season?.name ?? "Nije označena"}</p>
        </Link>
        <Link href="/admin/liga" className="rounded-xl border border-navy/10 bg-white p-5 hover:border-gold sm:col-span-2">
          <p className="text-sm text-muted">SportDC sync</p>
          <p className="mt-2 font-display text-lg text-navy">
            {sync.inProgress ? "u toku" : (sync.lastSuccess?.status ?? sync.latest?.status ?? "nije rađen")}
          </p>
          <p className="mt-1 text-xs text-muted">Posljednji sync: {formatDateTime(sync.lastSyncedAt)}</p>
        </Link>
      </div>
      {sync.lastWarning ? (
        <p className="rounded-xl border border-gold/40 bg-gold/15 px-4 py-3 text-sm text-navy">{sync.lastWarning}</p>
      ) : null}
      {sync.lastError ? (
        <p className="rounded-xl border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">{sync.lastError}</p>
      ) : null}
      <p className="text-sm text-muted">
        SportDC i dalje daje rezultat, raspored i tabelu. Ovdje se unosi sastav, minute, golovi, asistencije, kartoni i
        istorija kluba.
      </p>
    </div>
  );
}
