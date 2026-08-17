import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PendingButton } from "@/components/admin/PendingButton";
import { EmptyState } from "@/components/ui/Section";
import { getSeasons } from "@/lib/seasons";
import {
  activateSeasonAction,
  createSeasonAction,
  deactivateSeasonAction,
  updateSeasonAction,
} from "./actions";

function dateValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function AdminSeasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const seasons = await getSeasons();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-navy">Sezone</h1>
        <p className="mt-1 text-sm text-muted">Samo jedna sezona može biti aktivna. Sync može aktivirati sezonu iz SportDC-a.</p>
      </div>
      {error ? <p className="rounded-md bg-red/10 px-3 py-2 text-sm text-red">{error}</p> : null}

      <section className="rounded-xl border border-navy/10 bg-white p-5">
        <h2 className="mb-4 font-display text-xl">Nova sezona</h2>
        <form action={createSeasonAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            Naziv
            <input name="name" required placeholder="2026-2027" className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2" />
          </label>
          <label className="text-sm">
            Početak
            <input name="startDate" type="date" className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2" />
          </label>
          <label className="text-sm">
            Kraj
            <input name="endDate" type="date" className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2" />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="active" />
            Aktivna
          </label>
          <PendingButton
            pendingLabel="Dodajem…"
            className="rounded-full bg-navy px-4 py-2 text-sm text-gold disabled:opacity-60 sm:col-span-2 lg:col-span-4"
          >
            Dodaj sezonu
          </PendingButton>
        </form>
      </section>

      {seasons.length === 0 ? (
        <EmptyState title="Nema sezona" body="Dodajte sezonu ili pokrenite SportDC sync." />
      ) : (
        <ul className="space-y-4">
          {seasons.map((season) => {
            const update = updateSeasonAction.bind(null, season.id);
            const activate = activateSeasonAction.bind(null, season.id);
            const deactivate = deactivateSeasonAction.bind(null, season.id);
            return (
              <li key={season.id} className="rounded-xl border border-navy/10 bg-white p-5">
                <form action={update} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-sm">
                    Naziv
                    <input
                      name="name"
                      required
                      defaultValue={season.name}
                      className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Početak
                    <input
                      name="startDate"
                      type="date"
                      defaultValue={dateValue(season.startDate)}
                      className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Kraj
                    <input
                      name="endDate"
                      type="date"
                      defaultValue={dateValue(season.endDate)}
                      className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
                    />
                  </label>
                  <div className="flex flex-col justify-end gap-2 text-sm">
                    <p className={season.active ? "text-gold-dark" : "text-muted"}>
                      {season.active ? "aktivna" : "neaktivna"} · {season._count.matches} utakmica
                    </p>
                    <PendingButton
                      pendingLabel="Čuvam…"
                      className="rounded-full bg-navy px-4 py-2 text-gold disabled:opacity-60"
                    >
                      Sačuvaj
                    </PendingButton>
                  </div>
                </form>
                <div className="mt-3">
                  {season.active ? (
                    <ConfirmSubmit action={deactivate} message="Deaktivirati ovu sezonu?">
                      <button type="submit" className="text-sm text-red hover:underline">
                        Deaktiviraj
                      </button>
                    </ConfirmSubmit>
                  ) : (
                    <ConfirmSubmit
                      action={activate}
                      message="Aktivirati ovu sezonu? Trenutno aktivna će biti ugašena."
                    >
                      <button type="submit" className="text-sm text-navy hover:text-gold-dark">
                        Aktiviraj
                      </button>
                    </ConfirmSubmit>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
