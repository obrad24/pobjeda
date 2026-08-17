# Odluke

Format: datum, odluka, zašto. Nova odluka se **dodaje**, stare se ne brišu (mogu se označiti superseded).

## 2026-08-17 — Phase 1: Cheerio, ne Playwright

SportDC liga 6452 vraća puni SSR HTML (tabela, kola, JSON-LD, `data-club-id`). Playwright nije potreban. Ako SportDC pređe na čisti client render, revidirati.

## 2026-08-17 — Nema javnog SportDC JSON API-ja

Embed URL-ovi su 404. Embed textarea je prazan u SSR-u. Parser čita HTML lige i `/round/{n}`.

## 2026-08-17 — Club ID 8448 je identitet kluba

SportDC ime je `Pobjeda`, grad `Triješnica`. Exact match na „FK Pobjeda Triješnica“ bi padalo. Dva kluba se zovu `Borac` (7421 Trnjaci, 7802 Ugljevička Obrijež). U 1. kolu Pobjeda igra protiv **7802**.

## 2026-08-17 — LeagueStanding je SportDC keš

Phase 1 je preferirao računanje tabele iz rezultata. Prije 1. kola svi imaju 0 bodova, a SportDC ima fiksni redoslijed. Phase 3 zato čuva `LeagueStanding` snapshot sa sync-a. Unique `(leagueId, sportdcTeamId)`.

## 2026-08-17 — Datum za kola bez kickoffa

SportDC za kola 14–26 trenutno ne šalje `startDate` ni datum u HTML-u. Parser ne preskače te utakmice; datum je `2026-08-23 17:30 + (kolo-1) * 7 dana` dok izvor ne popuni polja.

## 2026-08-17 — Liga ID nije vječan

2026-27 = `6452`. 2025-26 Istok = `5995`. Env `SPORTDC_LEAGUE_ID` + `SPORTDC_LEAGUE_URL`. Club ID 8448 ostaje.

## 2026-08-17 — `data-res="n"` nije „nije odigrano“

Bez `.res-host` → scheduled. Sa skorovima i `n` → neriješeno (uključujući 0:0). `1`/`2` → pobjeda domaćin/gost.

## 2026-08-17 — Dva izvora istine

SportDC: liga, klubovi, raspored, rezultati. Neon: igrači, slike, sastavi, naši golovi/kartoni, istorija. Sync ne dira admin unose sastava.

## 2026-08-17 — Auth.js v5 beta + Next 16 `proxy.ts`

`next-auth@5` još nije stable tag; koristi se `5.0.0-beta.32`. Next 16 je `middleware.js` preimenovao u `proxy.ts`. Edge gate čita JWT iz `auth.config.ts` (bez Prisma). Node `auth.ts` radi Credentials + bcrypt. `requireAdmin()` i dalje provjerava `User` u bazi.

## 2026-08-17 — Upozorenje kad SportDC promijeni rezultat

Sync i dalje overwrite-uje `homeScore`/`awayScore`. Ako utakmica već ima sastav/golove/kartone, `SyncRun.warningMessage` i admin UI traže ručnu provjeru statistike. Eventi se ne brišu.

## 2026-08-17 — CI bez Neon-a

GitHub Actions pokreće Vitest, ESLint i `tsc`. Playwright i `npm run qa` ostaju lokalno jer trebaju bazu i SportDC.

## 2026-08-17 — Brisanje igrača samo bez statistike

`MatchPlayer`/`MatchGoal`/`MatchCard` imaju `onDelete: Restrict`. Admin briše igrača samo ako nema tih redova; inače deaktivacija.

## 2026-08-17 — Tailwind v4 @theme, Next 16, React 19

`create-next-app` scaffold: Next `16.3.1`, Tailwind 4 (nema `tailwind.config.js`). Dizajn tokeni idu u `app/globals.css`. Node 22 (`.nvmrc`); default nvm na mašini je bio 14.

## 2026-08-17 — Stadion sa SportDC je mjesto/grad

JSON-LD `location.name` = npr. `Triješnica`. Polje `Match.stadium` to čuva; pravo ime stadiona može admin kasnije dopuniti ako se doda override.

## 2026-08-17 — Historijska liga 5995 se ne synca

Javni sajt prati aktivnu ligu 6452. Arhiva prethodnih sezona nije u scope-u Phase 3.

## 2026-08-17 — Phase 1 ne implementira aplikaciju

Samo scaffold + dokumentacija + TASKS.md. Prisma schema i parser čekaju Phase 2–3.

## 2026-08-17 — Prisma 7 + Neon/pg adapteri

Prisma 7.9: `url` nije u `schema.prisma`; CLI koristi `prisma.config.ts` + `DIRECT_URL`. Runtime `PrismaClient` zahtijeva adapter. `@prisma/adapter-neon` za `*.neon.tech`, `@prisma/adapter-pg` za lokalni Postgres. Client output: `generated/prisma`.

## 2026-08-17 — SportDC polja: sportdcLeagueId / sportdcTeamId / sportdcMatchId

Phase 2 prompt eksplicitno traži ova imena. `Team.sportdcId` iz ranijeg DATABASE.md je **superseded** sa `sportdcTeamId`. Liga: `sportdcLeagueId` + unique `(seasonId, sportdcLeagueId)`.

## 2026-08-17 — Lokalni embedded Postgres dok nema Neon kredencijala

U okruženju nije bilo Neon URL-a. Migracija, seed i CRUD smoke su verifikovani na embedded PostgreSQL 18 (`npm run db:start`, port 54329). Produkcijski target ostaje Neon; zamjena je samo env.

## 2026-08-17 — Seed lozinka samo za development

`ADMIN_PASSWORD=pobjeda-dev` je lokalni default u `.env.example`. Nije produkcijski secret. Hash ide u bazu preko bcrypt; plaintext nije u schemi.
