import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PendingButton } from "@/components/admin/PendingButton";
import { EmptyState } from "@/components/ui/Section";
import { getClubHistoryAdmin } from "@/lib/history";
import { createHistoryAction, deleteHistoryAction, updateHistoryAction } from "./actions";

function HistoryFields({
  defaults,
}: {
  defaults?: { title: string; body: string; year: number | null; sortOrder: number; published: boolean };
}) {
  return (
    <>
      <label className="text-sm sm:col-span-2">
        Naslov
        <input
          name="title"
          required
          defaultValue={defaults?.title}
          className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Godina
        <input
          name="year"
          type="number"
          defaultValue={defaults?.year ?? ""}
          className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Redoslijed
        <input
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={defaults?.sortOrder ?? 0}
          className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        Tekst
        <textarea
          name="body"
          required
          rows={6}
          defaultValue={defaults?.body}
          className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-muted">Običan tekst. HTML se uklanja pri čuvanju.</span>
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="published" defaultChecked={defaults?.published ?? true} />
        Objavljeno na javnom sajtu
      </label>
    </>
  );
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const entries = await getClubHistoryAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-navy">Istorija kluba</h1>
        <p className="mt-1 text-sm text-muted">Unosi se prikazuju na /istorija ako su objavljeni.</p>
      </div>
      {error ? <p className="rounded-md bg-red/10 px-3 py-2 text-sm text-red">{error}</p> : null}

      <section className="rounded-xl border border-navy/10 bg-white p-5">
        <h2 className="mb-4 font-display text-xl">Novi unos</h2>
        <form action={createHistoryAction} className="grid gap-3 sm:grid-cols-2">
          <HistoryFields />
          <PendingButton
            pendingLabel="Dodajem…"
            className="rounded-full bg-navy px-4 py-2 text-sm text-gold disabled:opacity-60 sm:col-span-2"
          >
            Dodaj unos
          </PendingButton>
        </form>
      </section>

      {entries.length === 0 ? (
        <EmptyState title="Nema unosa" body="Dodajte prvi odlomak istorije kluba." />
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => {
            const update = updateHistoryAction.bind(null, entry.id);
            const remove = deleteHistoryAction.bind(null, entry.id);
            return (
              <li key={entry.id} className="rounded-xl border border-navy/10 bg-white p-5">
                <form action={update} className="grid gap-3 sm:grid-cols-2">
                  <HistoryFields defaults={entry} />
                  <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                    <PendingButton
                      pendingLabel="Čuvam…"
                      className="rounded-full bg-navy px-4 py-2 text-sm text-gold disabled:opacity-60"
                    >
                      Sačuvaj
                    </PendingButton>
                    <span className="text-xs text-muted">{entry.published ? "objavljeno" : "skica"}</span>
                  </div>
                </form>
                <ConfirmSubmit
                  action={remove}
                  message="Obrisati ovaj unos istorije?"
                  className="mt-3"
                >
                  <button type="submit" className="text-sm text-red hover:underline">
                    Obriši
                  </button>
                </ConfirmSubmit>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
