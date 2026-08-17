# Deployment — Vercel + Neon

Stack: Next.js 16 na Vercel, Neon PostgreSQL, Prisma 7, Vercel Cron, opciono Vercel Blob.

## 1. Neon setup

1. Napravi projekat na [console.neon.tech](https://console.neon.tech) (region npr. Frankfurt / `eu-central-1`).
2. Connect → kopiraj **pooled** URL (`-pooler` u hostname-u) kao `DATABASE_URL`.
3. Connect → kopiraj **direct** URL (bez `-pooler`) kao `DIRECT_URL`.
4. Oba URL-a trebaju `?sslmode=require`.
5. Isti region kao Vercel projekat radi latencije.

Lokalna alternativa bez Neon nalog: `npm run db:start` (embedded PostgreSQL 18 na `127.0.0.1:54329`).

## 2. Environment variables

Postavi na Vercel → Project → Settings → Environment Variables (Production + Preview). Iste ključeve kao `.env.example`:

| Ključ | Obavezno | Namjena |
| --- | --- | --- |
| `DATABASE_URL` | da | Neon pooled, runtime |
| `DIRECT_URL` | da | Neon direct, `prisma migrate deploy` |
| `SPORTDC_LEAGUE_URL` | da | `https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina` |
| `SPORTDC_LEAGUE_ID` | da | `6452` |
| `SPORTDC_CLUB_ID` | da | `8448` |
| `CRON_SECRET` | da | `openssl rand -base64 32` — Bearer za cron |
| `AUTH_SECRET` | da | `openssl rand -base64 32` — Auth.js JWT |
| `AUTH_URL` | preporučeno | produkcijski origin, npr. `https://pobjeda.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | ne | upload fotografija igrača |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ne u runtime | samo lokalni `npm run db:seed` |

Nema `NEXT_PUBLIC_*` tajni. Admin `/podesavanja` pokazuje samo da li je tajna postavljena.

## 3. Prisma migracije

Na mašini sa Node 22 i `.env` koji ima `DIRECT_URL`:

```bash
nvm use        # 22
npm ci
npx prisma migrate deploy
```

Migracije:

- `20260817104414_init`
- `20260817105831_sportdc_sync_run`
- `20260817134500_position_wg`
- `20260817160000_sync_warning`

Build na Vercel radi `prisma generate && next build` (`postinstall` takođe `prisma generate`). **Ne** radi `db push` u produkciji.

Prvi admin nalog: lokalno `npm run db:seed` protiv Neon-a (upsert User). U produkciji koristi jaku lozinku, ne `pobjeda-dev`.

## 4. Vercel projekat

1. [vercel.com](https://vercel.com) → Add New → Project.
2. Framework Preset: Next.js (auto).
3. Root: repo root. Node.js 22 (`.nvmrc` / `engines.node`).
4. Build command: `prisma generate && next build` (već u `package.json` `build`).
5. Install: `npm ci` ili `npm install`.
6. Output: default Next.js.
7. Serverless: App Router, Route Handlers (`/api/cron/sportdc-sync` `maxDuration = 60`, `/api/auth/[...nextauth]`), Server Actions. Prisma ide kroz `serverExternalPackages` i `@prisma/adapter-pg` (TCP na Neon pooled URL).

## 5. Git repository

Repo trenutno nema `origin`. Za Vercel Git integraciju:

```bash
git remote add origin git@github.com:ORG/pobjeda.git
git push -u origin main
```

Zatim u Vercel-u poveži GitHub repo (Import). Preview deploy za PR, production za `main`.

CI (GitHub Actions `.github/workflows/ci.yml`): `npm test`, `lint`, `tsc --noEmit` na Node 22. Ne zahtijeva Neon.

## 6. Production deployment

1. Env varijable na Vercel (korak 2).
2. `npx prisma migrate deploy` protiv `DIRECT_URL`.
3. Seed admin ako User još ne postoji.
4. Push na `main` ili `npx vercel --prod` (prijavljen CLI).
5. Provjeri da build log ima `ƒ Proxy (Middleware)` i rute `/admin`, `/api/cron/sportdc-sync`.

## 7. Vercel Cron

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sportdc-sync",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Hobby dozvoljava **jedan** Vercel Cron dnevno. `0 6 * * *` je 06:00 UTC (08:00 u Sarajevu ljeti). Češći sync: dugme **SINHRONIZUJ SADA** ili GitHub Actions (`.github/workflows/sportdc-sync.yml`) koje zove isti endpoint sa `CRON_SECRET`. Pro plan nije potreban za tu varijantu.

Vercel šalje `Authorization: Bearer $CRON_SECRET`. Ruta odbija zahtjev bez ispravnog Bearer-a (401). Bez `CRON_SECRET` u env → 500.

## 8. SportDC sync

Isti pipeline: cron i admin dugme zovu `syncSportDCLeague`.

- Upsert Team / Match / LeagueStanding. Unique ključevi sprečavaju duplikate.
- Ne dira Player, MatchPlayer, MatchGoal, MatchCard, ClubHistory.
- Ako se SportDC rezultat promijeni na utakmici sa unesenom statistikom, `SyncRun.warningMessage` upozori admina.
- Ako je SportDC nedostupan: `SyncRun` ERROR, postojeći podaci ostaju, admin vidi posljednji SUCCESS i grešku.

Ručni test nakon deploy-a:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" https://TVOJ-DOMEN/api/cron/sportdc-sync
```

Bez headera očekuj `401`.

## 9. Production test (nakon prvog deploy-a)

- [ ] `/` učitava, Pobjeda, sljedeća utakmica
- [ ] `/liga` tabela, gold red 8448
- [ ] `/igraci` (prazan sastav dok se ne unesu igrači)
- [ ] `/admin` → `/login`
- [ ] Prijava sa produkcijskim admin nalogom
- [ ] Cron 401 bez secret-a
- [ ] Cron 200 sa secret-om (ili admin sync)
- [ ] `/sitemap.xml` i `/robots.txt`
- [ ] Mobile 375px: hamburger

Lokalna provjera prije deploy-a:

```bash
npm run ci
npm run qa
npm run build
npm run test:e2e
```
