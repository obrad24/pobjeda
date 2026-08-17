import Link from "next/link";
import { EmptyState } from "@/components/ui/Section";
import { playerFullName, positionLabel } from "@/lib/format";
import { getPlayers } from "@/lib/players";

export default async function AdminPlayersPage() {
  const players = await getPlayers({ includeInactive: true });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy">Igrači</h1>
          <p className="mt-1 text-sm text-muted">Neaktivni ostaju u bazi, ali nestaju sa javne liste.</p>
        </div>
        <Link href="/admin/igraci/novi" className="rounded-full bg-navy px-4 py-2 text-center text-sm text-gold">
          Dodaj igrača
        </Link>
      </div>
      {players.length === 0 ? (
        <EmptyState title="Nema igrača" body="Dodajte prvi sastav da bi javni sajt imao kartice i statistiku." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-navy text-left text-white">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Ime</th>
                <th className="px-3 py-2">Pozicija</th>
                <th className="px-3 py-2">Godište</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-t border-navy/10">
                  <td className="px-3 py-2 font-display text-gold">{player.jerseyNumber ?? "—"}</td>
                  <td className="px-3 py-2">{playerFullName(player)}</td>
                  <td className="px-3 py-2">{positionLabel(player.position)}</td>
                  <td className="px-3 py-2">{player.birthYear ?? "—"}</td>
                  <td className="px-3 py-2">{player.active ? "aktivan" : "neaktivan"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/igraci/${player.id}`} className="text-navy hover:text-gold-dark">
                      Pregled
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
