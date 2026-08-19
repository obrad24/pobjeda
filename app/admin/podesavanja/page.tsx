import { getActiveSeason } from "@/lib/context";
import { getLeagueId, getLeagueUrl, getOurClubId } from "@/lib/sportdc/client";
import { isBlobConfigured } from "@/lib/uploads/player-photo";

function Flag({ ok }: { ok: boolean }) {
  return <span className={ok ? "text-navy" : "text-red"}>{ok ? "postavljeno" : "nije postavljeno"}</span>;
}

export default async function AdminSettingsPage() {
  const season = await getActiveSeason().catch(() => null);
  const league = season?.leagues[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Podešavanja</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Liga URL i ID dolaze iz okruženja. Promjena u produkciji ide kroz Vercel env, ne kroz ovaj obrazac.
        </p>
      </div>
      <dl className="grid gap-4 rounded-xl border border-navy/10 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">SPORTDC_LEAGUE_URL</dt>
          <dd className="mt-1 break-all text-navy">{getLeagueUrl()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">SPORTDC_LEAGUE_ID</dt>
          <dd className="mt-1 text-navy">{getLeagueId()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">SPORTDC_CLUB_ID</dt>
          <dd className="mt-1 text-navy">{getOurClubId()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">URL u bazi (posljednji sync)</dt>
          <dd className="mt-1 break-all text-navy">{league?.sportdcUrl ?? "nema lige u bazi"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Aktivna sezona</dt>
          <dd className="mt-1 text-navy">{season?.name ?? "nije označena"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">AUTH_SECRET</dt>
          <dd className="mt-1">
            <Flag ok={Boolean(process.env.AUTH_SECRET)} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">CRON_SECRET</dt>
          <dd className="mt-1">
            <Flag ok={Boolean(process.env.CRON_SECRET)} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Upload fotografija</dt>
          <dd className="mt-1">
            <Flag ok={isBlobConfigured()} />
            {isBlobConfigured() && process.env.VERCEL ? null : process.env.VERCEL ? (
              <p className="mt-1 text-xs text-muted">
                Povežite Blob store sa projektom (Storage → Projects) pa redeployujte.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">Lokalno se čuva u public/uploads (bez Vercel Blob tokena).</p>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
