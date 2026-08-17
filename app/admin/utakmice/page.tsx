import Link from "next/link";
import { EmptyState } from "@/components/ui/Section";
import { getOurTeam } from "@/lib/context";
import { formatShortDate, isOurMatch, opponentOf, roundLabel, scoreLabel } from "@/lib/format";
import { getMatches } from "@/lib/matches";

const TABS = [
  { id: "sve", label: "Sve" },
  { id: "naredne", label: "Naredne" },
  { id: "odigrane", label: "Odigrane" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function parseTab(value: string | undefined): Tab {
  if (value === "naredne" || value === "odigrane" || value === "sve") {
    return value;
  }
  return "sve";
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);
  const ourTeam = await getOurTeam();
  const matches = await getMatches({
    ourTeamOnly: false,
    includeFriendlies: true,
    limit: 200,
    ...(tab === "naredne" ? { status: "SCHEDULED" as const } : {}),
    ...(tab === "odigrane" ? { status: "FINISHED" as const } : {}),
  });
  const ordered =
    tab === "odigrane"
      ? [...matches].sort((a, b) => b.date.getTime() - a.date.getTime())
      : matches;

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-navy">Utakmice</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Rezultat dolazi sa SportDC-a i ovdje se ne mijenja. Statistiku unesite samo za utakmice FK Pobjede.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={item.id === "sve" ? "/admin/utakmice" : `/admin/utakmice?tab=${item.id}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === item.id ? "bg-navy text-gold" : "border border-navy/15 bg-white text-navy"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {ordered.length === 0 ? (
        <EmptyState title="Nema utakmica" body="Pokrenite SportDC sync ili sačekajte raspored." />
      ) : (
        <ul className="divide-y divide-navy/10 overflow-hidden rounded-xl border border-navy/10 bg-white">
          {ordered.map((match) => {
            const ours = isOurMatch(match, ourTeam.id);
            const title = ours
              ? `${roundLabel(match.round)} · ${opponentOf(match, ourTeam.id).sportdcName}`
              : `${roundLabel(match.round)} · ${match.homeTeam.sportdcName} – ${match.awayTeam.sportdcName}`;
            return (
              <li key={match.id}>
                <Link
                  href={`/admin/utakmice/${match.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-cream"
                >
                  <div>
                    <p className="font-medium text-navy">
                      {title}
                      {ours ? <span className="ml-2 text-xs text-gold-dark">naša</span> : null}
                    </p>
                    <p className="text-xs text-muted">
                      {formatShortDate(match.date)} · {scoreLabel(match)}
                    </p>
                  </div>
                  <span className="text-sm text-gold-dark">{ours ? "Unesi statistiku" : "Detalji"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
