import Link from "next/link";
import type { MatchListItem } from "@/lib/matches";
import {
  formatShortDate,
  isHomeGame,
  opponentOf,
  resultForUs,
  roundLabel,
} from "@/lib/format";
import { TeamCrest } from "@/components/ui/TeamCrest";

const RESULT_STYLES = {
  win: "bg-gold text-navy-dark",
  draw: "bg-navy/15 text-navy",
  loss: "bg-red text-white",
} as const;

const RESULT_LABEL = {
  win: "Pobjeda",
  draw: "Neriješeno",
  loss: "Poraz",
} as const;

export function RecentResults({
  matches,
  ourTeamId,
}: {
  matches: MatchListItem[];
  ourTeamId: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {matches.map((match) => {
        const opponent = opponentOf(match, ourTeamId);
        const home = isHomeGame(match, ourTeamId);
        const result = resultForUs(match, ourTeamId);
        const ours = home ? match.homeScore : match.awayScore;
        const theirs = home ? match.awayScore : match.homeScore;

        return (
          <Link
            key={match.id}
            href={`/utakmice/${match.id}`}
            prefetch={false}
            className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm transition hover:border-gold"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>{roundLabel(match.round)}</span>
              <span>{formatShortDate(match.date)}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <TeamCrest name={opponent.name} logo={opponent.logo} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-navy">{opponent.sportdcName}</p>
                <p className="text-xs uppercase tracking-wide text-muted">{home ? "Domaćin" : "Gost"}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-display text-2xl tabular-nums text-navy">
                {ours ?? "-"} : {theirs ?? "-"}
              </p>
              {result ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${RESULT_STYLES[result]}`}>
                  {RESULT_LABEL[result]}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
