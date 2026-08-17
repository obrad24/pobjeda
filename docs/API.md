# API i server mutacije

Nema javnog REST API-ja za treće strane. Podaci idu kroz Server Components, Server Actions i mali broj Route Handler-a.

Javne stranice **ne** smiju zvati Prisma iz Client Components, niti slati `DATABASE_URL` u browser. Čitanje ide isključivo kroz funkcije ispod, na serveru.

Validacija ulaza: **Zod** (`lib/validation`). Neispravan payload baca `ValidationError`; nepostojeći zapis baca `NotFoundError`.

## Čitanje za javni sajt (Phase 4)

Server Components zovu ove module. Scraping SportDC-a (`lib/sportdc/matches.ts`, `lib/sportdc/standings.ts`) je za sync, ne za page load.

### Igrači — `lib/players`

| Funkcija | Namjena |
| --- | --- |
| `getPlayers({ includeInactive?, position? })` | Aktivni igrači (neaktivni samo uz `includeInactive`) |
| `getPlayer(id)` | Jedan igrač po našem ID-u |
| `getPlayerBySlug(slug)` | Profil `/igraci/[slug]` |
| `createPlayer(input)` | Admin: novi igrač, slug iz imena, unique broj dresa među aktivnima |
| `updatePlayer(id, input)` | Admin: djelimično ažuriranje |
| `deactivatePlayer(id)` | Admin: `active=false` (nema hard delete u javnom API-ju) |

### Utakmice — `lib/matches`

Čita **Neon**, ne živi SportDC HTML.

| Funkcija | Namjena |
| --- | --- |
| `getMatch(id)` | Detalj sa sastavom, golovima i kartonima |
| `getMatchBySportDcId(id)` | Interno / sync dijagnostika |
| `getMatches(query)` | Lista (sezona, kolo, status, naš tim) |
| `getUpcomingMatches(query)` | Default: naš tim, `SCHEDULED`, limit 10 |
| `getRecentMatches(query)` | Default: naš tim, `FINISHED`, limit 3 |
| `getMatchesByRound(round, query)` | Sva kola lige (npr. 7 utakmica u 1. kolu) |

`round = 0` su test/prijateljske (seed). Ligaški raspored i rezultati ih isključuju osim uz `includeFriendlies: true`.

Admin unos (ne mijenja SportDC skor):

| Funkcija | Namjena |
| --- | --- |
| `saveMatchStatistics(matchId, { lineups, goals, cards, penaltyMisses, concededGoals })` | sastav + eventi u transakciji; zatim fantasy recalculate |
| `saveMatchLineup(matchId, lineups)` | samo sastav; zadrži evente kompatibilne sa novim sastavom |
| `saveMatchEvents(matchId, { goals, cards })` | golovi/kartoni uz postojeći sastav |

### Statistika — `lib/stats`

Računa se iz `MatchPlayer` / `MatchGoal` / `MatchCard`. Nema denormalizovanih `Player.goals` kolona.

Pravilo (vidi `docs/STATISTICS.md`): ako utakmica ima event redove, oni imaju prednost; inače fallback na brojače u `MatchPlayer`. `SECOND_YELLOW` broji i žuti i crveni.

| Funkcija | Namjena |
| --- | --- |
| `getPlayerStatistics(playerId, { seasonId? })` | Sezonski agregat jednog igrača |
| `getSeasonPlayerStatistics({ seasonId? })` | Svi igrači sa nastupom |
| `getTeamStatistics({ seasonId? })` | W-D-L, golovi, sljedeća/zadnja utakmica, pozicija iz tabele |
| `getTopScorers({ limit?, seasonId? })` | Strijelci |
| `getTopAssists({ limit?, seasonId? })` | Asistencije |
| `getTopAppearances({ limit?, seasonId? })` | Nastupi |

Dok nema `MatchPlayer` unosa, leaderboardi su prazni (`hasData: false`) — UI ne prikazuje lažne nule kao da je sezona odigrana.

### Fantasy — `lib/fantasy`

Bodovi se ne računaju u Reactu. Vidi [FANTASY.md](./FANTASY.md).

| Funkcija | Namjena |
| --- | --- |
| `calculateMatchPlayerPoints` / `calculateMatchFantasy` | čisti obračun iz statistike + rules |
| `getFantasyLeaderboard({ seasonId?, round?, sort? })` | sezonska/kolo tabela |
| `getFantasyGameweekLeaderboard({ seasonId, round })` | bodovi jednog kola |
| `getPlayerFantasyProfile(playerId, seasonId?)` | profil: ukupno, rang, istorija |
| `recalculateMatchFantasy(matchId)` | upis `FantasyMatchPoints` |
| `recalculateSeasonFantasy(seasonId)` | admin recalculate |

### Liga — `lib/league`

| Funkcija | Namjena |
| --- | --- |
| `getStandings({ seasonId?, leagueId? })` | Tabela. Source of truth: SportDC keš `LeagueStanding`. Fallback: `computeStandings` iz FINISHED ligaških utakmica. |
| `getComputedStandings(...)` | Samo izračun iz rezultata (poređenje, ne javni default) |
| `getSchedule(query)` | Raspored po kolima (`round > 0`) |
| `getResults(query)` | Završene ligaške utakmice po kolima |

`computeStandings`: 3 boda pobjeda, 1 neriješeno; sort: bodovi → gol-razlika → dati golovi → ime. Ako se razlikuje od SportDC reda, ne „ispravljati“ SportDC.

### SportDC sync — `lib/sportdc/sync`

| Funkcija | Namjena |
| --- | --- |
| `syncSportDCLeague` / `triggerSportDcSync` | Fetch + upsert Team/Match/LeagueStanding. Ne dira igrače ni evente. |
| `getLatestSyncRun` | Posljednji pokušaj (bilo koji status) |
| `getLatestSuccessfulSync` | Posljednji `SUCCESS` |
| `getSyncStatus` | `{ latest, lastSuccess, inProgress, lastSyncedAt, lastError }` |

## Route Handlers

### `GET /api/cron/sportdc-sync`

Vercel Cron + ručni poziv.

**Zaštita:** `Authorization: Bearer ${CRON_SECRET}` ili `?secret=` **nije** dozvoljen u query stringu (curi u logove). Samo header.

Ako secret nije postavljen u produkciji → 500, sync se ne izvršava.

**Odgovor:** JSON sa brojem upsertovanih timova/utakmica, vremenom, greškama po kolu.

**Ponašanje:**

1. Fetch liga + kola 1..N
2. Prisma upsert
3. `revalidatePath` / `revalidateTag` za `/`, `/liga`, `/rezultati`, `/utakmice/[id]`

Rate limit: internim lockom (`SyncRun` RUNNING). Ako je sync već u toku < 2 min, vratiti 409.

### Auth rute

Auth.js: `/api/auth/*` (login, logout, session). Nema public signup.

## Server Actions (admin)

Sve sa `requireAdmin()` (sesija + `User.role` u bazi). Ista Zod validacija i servisi kao gore:

| Akcija | Namjena |
| --- | --- |
| `createPlayer` / `updatePlayer` / `deactivatePlayer` / `deletePlayer` | igrači (`/admin/igraci`); delete samo bez evenata |
| `saveMatchLineup` / `saveMatchEvents` / `saveMatchStatistics` | sastav i eventi (`/admin/utakmice`) |
| `recalculateFantasyAction` | preračun sezone (`/admin/fantasy`) |
| `createHistoryEntry` / `updateHistoryEntry` / `deleteHistoryEntry` | istorija |
| `triggerSportDcSync` | isti kod kao cron (`SINHRONIZUJ SADA`) |
| `createSeason` / `updateSeason` / `activateSeason` / `deactivateSeason` | sezone |

Client validacija je UX, nije zaštita.

## Cron raspored

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

Hobby: jednom dnevno (06:00 UTC). Češće: admin sync ili GitHub Actions `sportdc-sync.yml`.

## Env koje API koristi

Vidi `.env.example`. Nikad ne vraćati secret u JSON odgovoru.

## Test

```bash
npm test
npm run backend:smoke
```

Unit: Zod, `computeStandings`, agregacija statistike.
Smoke (Neon): utakmice, tabela, raspored, rezultati, sync status, CRUD igrača na privremenom fixture-u.
