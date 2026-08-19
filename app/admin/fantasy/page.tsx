import Link from "next/link";
import { RecalculateFantasyButton } from "@/components/admin/RecalculateFantasyButton";
import { FantasyBreakdownList } from "@/components/fantasy/FantasyBreakdownList";
import { getFantasyAdminOverview, getPlayerFantasyProfile } from "@/lib/fantasy";
import { fantasyPositionLabel } from "@/lib/fantasy";
import { getPlayerBySlug } from "@/lib/players";
import { playerFullName, roundLabel, seasonLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminFantasyPage({
  searchParams,
}: {
  searchParams: Promise<{ sezona?: string; igrac?: string }>;
}) {
  const params = await searchParams;
  const overview = await getFantasyAdminOverview(params.sezona);
  const selectedPlayer = params.igrac ? await getPlayerBySlug(params.igrac).catch(() => null) : null;
  const profile = selectedPlayer
    ? await getPlayerFantasyProfile(selectedPlayer.id, overview.season.id)
    : overview.leaderboard[0]
      ? await getPlayerFantasyProfile(overview.leaderboard[0].playerId, overview.season.id)
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">Admin</p>
          <h1 className="mt-1 font-display text-3xl text-navy">Fantasy Pobjeda</h1>
          <p className="mt-1 text-sm text-muted">
            Sezona {seasonLabel(overview.season.name)}. Bodovi se ne unose ručno — samo statistika utakmice, zatim
            preračun.
          </p>
        </div>
        <RecalculateFantasyButton seasonId={overview.season.id} />
      </div>

      <section className="overflow-hidden rounded-xl border border-navy/10 bg-white">
        <h2 className="border-b border-navy/10 px-4 py-3 font-display text-xl">Scoring rules</h2>
        <ul className="divide-y divide-navy/10 sm:hidden">
          {overview.rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium text-navy">{rule.name}</span>
                <span className="block truncate font-mono text-[10px] text-muted">{rule.key}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-lg tabular-nums text-navy">{rule.points}</span>
                <span className="text-[10px] text-muted">{rule.active ? "aktivno" : "neaktivno"}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="hidden sm:block">
          <table className="w-full text-sm text-navy">
            <thead className="bg-cream text-left">
              <tr>
                <th className="px-4 py-2">Ključ</th>
                <th className="px-4 py-2">Naziv</th>
                <th className="px-4 py-2">Bodovi</th>
                <th className="px-4 py-2">Aktivno</th>
              </tr>
            </thead>
            <tbody>
              {overview.rules.map((rule) => (
                <tr key={rule.id} className="border-t border-navy/10">
                  <td className="px-4 py-2 font-mono text-xs">{rule.key}</td>
                  <td className="px-4 py-2">{rule.name}</td>
                  <td className="px-4 py-2 tabular-nums">{rule.points}</td>
                  <td className="px-4 py-2">{rule.active ? "da" : "ne"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {overview.latestRound != null ? (
        <section className="rounded-xl border border-navy/10 bg-white p-4">
          <h2 className="mb-3 font-display text-xl">Bodovi po utakmici · {roundLabel(overview.latestRound)}</h2>
          <ul className="divide-y divide-navy/10">
            {overview.lastGameweek.map((row) => (
              <li key={row.playerId} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/admin/igraci/${row.player.id}`} className="text-navy hover:text-gold-dark">
                  {playerFullName(row.player)}
                  <span className="ml-2 text-xs text-muted">{fantasyPositionLabel(row.position)}</span>
                </Link>
                <span className="font-display text-lg tabular-nums">{row.points}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <h2 className="mb-3 font-display text-xl">Tabela sezone</h2>
        {overview.leaderboard.length === 0 ? (
          <p className="text-sm text-muted">Nema izračunatih fantasy bodova. Unesite sastav utakmice pa preračunajte.</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {overview.leaderboard.map((row) => (
              <li key={row.playerId} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="mr-2 font-display text-gold">{row.rank}.</span>
                  <Link href={`/admin/fantasy?igrac=${row.player.slug}`} className="text-navy hover:text-gold-dark">
                    {playerFullName(row.player)}
                  </Link>
                </span>
                <span className="tabular-nums">
                  {row.points} · prosjek {row.average.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile && profile.history.length > 0 ? (
        <section className="rounded-xl border border-navy/10 bg-white p-4">
          <h2 className="mb-3 font-display text-xl">
            Breakdown · {selectedPlayer ? playerFullName(selectedPlayer) : playerFullName(overview.leaderboard[0].player)}
          </h2>
          <p className="mb-4 text-sm text-muted">
            Ukupno {profile.total} · prosjek {profile.average.toFixed(1)}
            {profile.rank != null ? ` · rang ${profile.rank}.` : ""}
          </p>
          <div className="space-y-4">
            {profile.history.map((row) => (
              <div key={row.matchId} className="rounded-lg border border-navy/10 p-3">
                <p className="mb-2 text-sm font-medium text-navy">
                  {roundLabel(row.round)} · {row.home ? "vs" : "@"} {row.opponentSlugName} · {row.points} bod.
                </p>
                <FantasyBreakdownList breakdown={row.breakdown} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
