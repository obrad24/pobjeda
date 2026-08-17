import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PendingButton } from "@/components/admin/PendingButton";
import { getActiveSeason } from "@/lib/context";
import { formatDateTime } from "@/lib/format";
import { getLeagueId, getLeagueUrl } from "@/lib/sportdc/client";
import { getSyncStatus } from "@/lib/sportdc/sync";
import { triggerSyncAction } from "./actions";

export default async function AdminLeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [sync, season] = await Promise.all([getSyncStatus(), getActiveSeason().catch(() => null)]);
  const league = season?.leagues[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Liga / SportDC</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Sync ažurira klubove, raspored, rezultate i tabelu. Ne dira igrače, sastave, golove ni istoriju.
        </p>
      </div>
      {error ? <p className="rounded-md bg-red/10 px-3 py-2 text-sm text-red">{error}</p> : null}
      <dl className="grid gap-4 rounded-xl border border-navy/10 bg-white p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Izvor</dt>
          <dd className="mt-1 text-navy">SportDC (HTML scrape)</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">SportDC URL</dt>
          <dd className="mt-1 break-all text-navy">{league?.sportdcUrl ?? getLeagueUrl()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">League ID</dt>
          <dd className="mt-1 text-navy">{league?.sportdcLeagueId ?? getLeagueId()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Aktivna sezona</dt>
          <dd className="mt-1 text-navy">{season?.name ?? "Nije označena"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Status</dt>
          <dd className="mt-1 text-navy">
            {sync.inProgress ? "RUNNING" : (sync.latest?.status ?? "nije rađen")}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Posljednji uspješan sync</dt>
          <dd className="mt-1 text-navy">{formatDateTime(sync.lastSyncedAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Posljednja greška</dt>
          <dd className="mt-1 text-navy">{sync.lastError ?? "nema"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Upozorenje (promjena rezultata)</dt>
          <dd className="mt-1 text-navy">{sync.lastWarning ?? "nema"}</dd>
        </div>
      </dl>
      <ConfirmSubmit
        action={triggerSyncAction}
        message="Pokrenuti SportDC sinhronizaciju sada? Rezultati i tabela će se ažurirati iz izvora."
      >
        <PendingButton
          pendingLabel="Sinhronizujem…"
          disabled={sync.inProgress}
          className="rounded-full bg-navy px-6 py-2.5 text-sm text-gold disabled:opacity-60"
        >
          SINHRONIZUJ SADA
        </PendingButton>
      </ConfirmSubmit>
    </div>
  );
}
