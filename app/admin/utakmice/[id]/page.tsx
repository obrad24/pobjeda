import Link from "next/link";
import { MatchStatsForm } from "@/components/admin/MatchStatsForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { resetMatchStatisticsAction } from "@/app/admin/utakmice/actions";
import { getOurTeam } from "@/lib/context";
import { formatMatchDate, isOurMatch, opponentOf, roundLabel, scoreLabel } from "@/lib/format";
import { getMatch, ourEnteredGoalsMismatch } from "@/lib/matches";
import { orNotFound } from "@/lib/not-found";
import { getPlayers } from "@/lib/players";

type Props = { params: Promise<{ id: string }> };

export default async function AdminMatchPage({ params }: Props) {
  const { id } = await params;
  let match;
  try {
    match = await getMatch(id);
  } catch (error) {
    orNotFound(error);
  }

  const ourTeam = await getOurTeam();
  const ours = isOurMatch(match, ourTeam.id);
  const players = ours ? await getPlayers({ includeInactive: true }) : [];
  const active = players.filter((player) => player.active || match.lineups.some((row) => row.playerId === player.id));
  const opponent = ours ? opponentOf(match, ourTeam.id) : null;
  const warning = ours ? ourEnteredGoalsMismatch(match, ourTeam.id) : null;
  const hasStatistics =
    match.lineups.length +
      match.goals.length +
      match.cards.length +
      match.penaltyMisses.length +
      match.concededGoals.length +
      match.substitutions.length >
    0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">{roundLabel(match.round)}</p>
        <h1 className="font-display text-3xl text-navy">
          {ours && opponent
            ? `vs ${opponent.name} · ${scoreLabel(match)}`
            : `${match.homeTeam.name} – ${match.awayTeam.name} · ${scoreLabel(match)}`}
        </h1>
        <p className="mt-1 text-sm text-muted">{formatMatchDate(match.date)}</p>
        <Link href={`/utakmice/${match.id}`} className="mt-2 inline-block text-sm text-navy hover:text-gold-dark">
          Javna stranica
        </Link>
      </div>
      {ours && hasStatistics ? (
        <ConfirmSubmit
          action={resetMatchStatisticsAction.bind(null, match.id)}
          message="Resetovati statistiku ovog meča? Biće obrisani sastav, događaji i fantasy bodovi, dok rezultat ostaje sačuvan."
        >
          <button
            type="submit"
            className="rounded-full border border-red/30 bg-red/10 px-4 py-2 text-sm font-medium text-red transition hover:bg-red/20"
          >
            Resetuj statistiku
          </button>
        </ConfirmSubmit>
      ) : null}
      {ours ? (
        <MatchStatsForm match={match} players={active} warning={warning} />
      ) : (
        <p className="rounded-xl border border-navy/10 bg-white p-5 text-sm text-muted">
          Ovo nije utakmica FK Pobjede. Sastav i eventi se unose samo za naše mečeve. Rezultat ostaje sa SportDC-a.
        </p>
      )}
    </div>
  );
}
