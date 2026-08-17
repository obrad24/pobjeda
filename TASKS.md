# TASKS.md — FK Pobjeda Triješnica

Source of truth za stanje projekta. Task je `[x]` samo ako je **implementiran i testiran**.

Prije svake faze: pročitati ovaj fajl, relevantne `docs/`, naći sljedeće `[ ]`, implementirati, testirati, označiti, ažurirati docs ako treba.

**Trenutna faza:** Phase 9 — Fantasy Pobjeda.

**Sljedeći task:** Phase 8 ostatak — povezati GitHub + Vercel, postaviti env, `migrate deploy`, prvi produkcijski smoke. Fantasy je odvojena faza; ne miješati sa deploy-om.

---

## PHASE 1 — Setup

- [x] Analizirati postojeći folder (bio prazan)
- [x] Analizirati SportDC HTML (liga 6452, club 8448, SSR, Cheerio)
- [x] Inicijalizovati Next.js App Router + TypeScript + Tailwind (Next 16.3.1)
- [x] Zaključati Node 22 (`.nvmrc`)
- [x] Kreirati `app/`, `components/`, `lib/`, `prisma/`, `public/`, `docs/`
- [x] Napisati `docs/ARCHITECTURE.md`
- [x] Napisati `docs/DATABASE.md`
- [x] Napisati `docs/SPORTDC.md`
- [x] Napisati `docs/API.md`
- [x] Napisati `docs/FRONTEND.md`
- [x] Napisati `docs/ADMIN.md`
- [x] Napisati `docs/STATISTICS.md`
- [x] Napisati `docs/SECURITY.md`
- [x] Napisati `docs/TESTING.md`
- [x] Napisati `docs/DEPLOYMENT.md`
- [x] Napisati `docs/DECISIONS.md`
- [x] Napraviti `.env.example` (bez tajni)
- [x] Napraviti ovaj `TASKS.md`

---

## PHASE 2 — Database

- [x] Instalirati Prisma + Prisma adapter za Neon/pg
- [x] Napisati `prisma/schema.prisma` prema `docs/DATABASE.md`
- [x] User, Player, Team, Season, League, Match, MatchPlayer, MatchGoal, MatchCard, ClubHistory
- [x] Enumi: Role, Position, MatchStatus, CardType
- [x] Unique: Team.sportdcTeamId, Match.sportdcMatchId, Player.slug, MatchPlayer (matchId, playerId)
- [x] `lib/db/prisma.ts` singleton
- [x] Migracija (`prisma/migrations/20260817104414_init`)
- [x] Seed: sezona 2026-2027, liga 6452, tim 8448 `isOurTeam`, 16 igrača, utakmice
- [x] Ažurirati `.env.example` ako schema zatraži nove ključeve
- [x] Ažurirati `docs/DATABASE.md` ako schema odstupi
- [x] CRUD smoke test (`npm run db:smoke`)

---

## PHASE 3 — SportDC

- [x] Dodati `cheerio` dependency
- [x] `lib/sportdc/client.ts` — GET, timeout, retry, User-Agent, pauza
- [x] `lib/sportdc/parser.ts` — tabela `data-club-id` + utakmice `data-id` / `--index`
- [x] Ispravno razlikovati scheduled (`game-notif`) vs 0:0 (`.res-host`)
- [x] Identifikacija kluba primarno `SPORTDC_CLUB_ID=8448`
- [x] Deduplikacija duplog `game-row` markup-a
- [x] HTML fixture-i u `lib/sportdc/__fixtures__/`
- [x] Unit testovi parsera (dva Borac, Pobjeda 8448, utakmica 604152)
- [x] `syncSportDCLeague` upsert u Neon (14 klubova, 182 utakmice)
- [x] `SyncRun` + error handling bez brisanja podataka
- [x] `GET /api/cron/sportdc-sync` + Bearer `CRON_SECRET`
- [x] `docs/SPORTDC.md` update

---

## PHASE 4 — Backend

- [x] `lib/sportdc/sync.ts` — upsert Team + Match za kola 1..N
- [x] Sync ne dira MatchPlayer / MatchGoal / MatchCard / Player / ClubHistory
- [x] `lib/league/standings.ts` — SportDC keš kao source of truth + `computeStandings` iz FINISHED utakmica
- [x] `GET /api/cron/sportdc-sync` + Bearer `CRON_SECRET` + timing-safe compare
- [x] `triggerSportDcSync` / `getSyncStatus` za admin (isti servis; UI u Phase 7)
- [x] `revalidatePath` nakon uspješnog sync-a
- [x] `lib/stats/player-stats.ts` prema `docs/STATISTICS.md` (eventi > brojači, bez duplicate aggregata)
- [x] Igrači: `createPlayer` `updatePlayer` `getPlayer` `getPlayerBySlug` `getPlayers` `deactivatePlayer`
- [x] Utakmice (Neon): `getMatch` `getMatches` `getUpcomingMatches` `getRecentMatches` `getMatchesByRound`
- [x] Statistika: `getPlayerStatistics` `getTeamStatistics` `getTopScorers` `getTopAssists` `getTopAppearances`
- [x] Liga: `getStandings` `getSchedule` `getResults`
- [x] Zod validacija ulaza (`lib/validation`)
- [x] Zaštita: 401 bez secret-a, 409 ako je sync već u toku
- [x] Testovi: `npm test` + `npm run backend:smoke`

---

## PHASE 5 — Public Website

- [x] Dizajn tokeni u `app/globals.css` (`@theme`)
- [x] `Header` (navy, logo, gold active, mobile meni)
- [x] `Footer` (navy-dark, gold, crvena linija)
- [x] `/` — sljedeća utakmica, zadnja 3 rezultata, statistika, sastav, tabela
- [x] `/igraci` + PlayerCard
- [x] `/igraci/[slug]`
- [x] `/statistika`
- [x] `/liga` — tabela, gold highlight našeg tima
- [x] `/rezultati` — kola, raspored i rezultati
- [x] `/utakmice/[id]`
- [x] `/istorija`
- [x] Prazna stanja prije 1. kola
- [x] `lang` i metadata (naslov FK Pobjeda Triješnica)
- [x] Responsive provjera glavnih stranica

---

## PHASE 6 — Players & Statistics

- [x] Javna statistika isključivo iz MatchPlayer / MatchGoal / MatchCard
- [x] Sortiranje: golovi, minute, nastupi
- [x] Profil: broj, pozicija, bivši klubovi, sezonski agregat
- [x] Neaktivni igrači skriveni sa `/igraci`
- [x] Stranica utakmice: sastav ako postoji unos
- [x] Fallback pravilo eventi vs brojači (dokumentovano u STATISTICS.md)
- [x] Pozicija Krilo (`WG`)
- [x] `saveMatchStatistics` / `saveMatchLineup` / `saveMatchEvents` — ne dira SportDC skor
- [x] Admin CRUD igrača (`/admin/igraci`)
- [x] Admin unos sastava, minuta, golova, kartona (`/admin/utakmice`)
- [x] `revalidatePath` nakon čuvanja (početna, statistika, profili)
- [x] Testovi: minute, validacija evenata, smoke da 1:1 nije gol igrača

---

## PHASE 7 — Admin

- [x] Auth.js Credentials + bcrypt
- [x] `/login`
- [x] `app/admin/layout.tsx` auth gate
- [x] `/admin` dashboard
- [x] `/admin/igraci` CRUD + deaktivacija
- [x] Upload / URL fotografije (Vercel Blob ili URL polje)
- [x] `/admin/utakmice` — sastav, minute, golovi, asistencije, kartoni
- [x] `/admin/liga` — pregled + Sync dugme
- [x] `/admin/sezone`
- [x] `/admin/istorija`
- [x] `/admin/podesavanja`
- [x] `requireAdmin()` na svim Server Actions

---

## PHASE 8 — QA & Deployment

- [x] Vitest + parser testovi u CI skripti (`.github/workflows/ci.yml`, `npm run ci`)
- [x] Playwright smoke: početna, liga, login redirect (`npm run test:e2e`)
- [x] Cron 401 bez secret-a (`npm run qa`)
- [x] Sync ne briše sastav (`npm run qa` score-drift)
- [x] `vercel.json` cron (dodat u Phase 3)
- [x] `prisma generate` u build
- [ ] Neon + Vercel env (Neon radi; Vercel projekat još nije povezan)
- [ ] Produkcijski smoke nakon prvog deploy-a
- [x] Ažurirati `docs/DEPLOYMENT.md` stvarnim koracima

---

## PHASE 9 — Fantasy Pobjeda

- [x] `docs/FANTASY.md` + scoring tabela po pozicijama
- [x] `FantasyScoringRule` po sezoni (nije hardkodovano zauvek)
- [x] `FantasyMatchPoints` + JSONB breakdown
- [x] `MatchPenaltyMiss`, `MatchConcededGoal`, `MatchGoal.ownGoal`, `MatchPlayer.saves` / `penaltySaves`
- [x] Mapiranje pozicija: GK/DF/MF+WG/FW → GK/DEF/MID/FWD
- [x] `lib/fantasy/` engine: `calculateMatchPlayerPoints`, sezona, kolo, leaderboard
- [x] Automatski obračun nakon `saveMatchStatistics`
- [x] Admin `/admin/fantasy` + **RECALCULATE FANTASY POINTS**
- [x] Admin unos: autogol, promašen penal, odbrane, minute primljenih golova
- [x] Javna `/fantasy` (sezona, kolo, tabela, POTR, posljednje kolo, forma)
- [x] Navigacija **Fantasy Pobjeda**
- [x] Profil `/igraci/[slug]` Fantasy sekcija + istorija + grafikon
- [x] Responsive kartice na telefonu, bez horizontalnog overflow-a tabele
- [x] Unit testovi scoring engine-a
- [ ] Korisnički fantasy timovi / budžet / lige (nije u ovoj fazi)

---

## Backlog (nije u trenutnom scope-u)

- [ ] Arhiva prethodnih SportDC sezona (5995 i starije)
- [ ] Live MQTT skor
- [ ] Više uloga osim ADMIN
- [ ] SportDC embed widget umjesto parsera
- [ ] Playwright fallback
