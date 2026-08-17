# Baza — Neon PostgreSQL + Prisma

Neon je produkcijska baza. Prisma 7 je ORM. Runtime koristi driver adapter: **Neon** kada `DATABASE_URL` sadrži `neon.tech`, inače **pg** (lokalni PostgreSQL).

Aggregate statistike igrača se **ne čuvaju** kao denormalizovana polja; računaju se iz `MatchPlayer`, `MatchGoal` i `MatchCard`. Fantasy bodovi se čuvaju u `FantasyMatchPoints` jer se računaju iz više evenata i trebaju breakdown + brzi leaderboard; i dalje se mogu u potpunosti preračunati iz statistike.

`LeagueStanding` je **keš tabele sa SportDC-a** (Phase 3). Potreban je jer prije početka sezone svi imaju 0 bodova, pa se redoslijed ne može izračunati iz rezultata. Javni sajt može prikazati ovaj snapshot; kasnije se i dalje može računati tabela iz `Match`.

## Konekcija

| Env | Namjena |
| --- | --- |
| `DATABASE_URL` | Pooled URL za runtime (`PrismaClient` + adapter) |
| `DIRECT_URL` | Direct URL za Prisma CLI (`prisma migrate`) |

Prisma 7 **nema** `url` u `schema.prisma`. CLI čita `DIRECT_URL` iz `prisma.config.ts`.

```prisma
datasource db {
  provider = "postgresql"
}
```

```typescript
// prisma.config.ts
datasource: {
  url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
}
```

```typescript
// lib/db/prisma.ts
new PrismaClient({
  adapter: connectionString.includes("neon.tech")
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString }),
})
```

Klijent se generiše u `generated/prisma` (`postinstall` / `npm run db:generate`). Folder nije u gitu.

## Modeli (implementirano)

Identifikatori sa SportDC-a, unique da spriječe duplikate:

| Model | Polje | Unique |
| --- | --- | --- |
| Team | `sportdcTeamId` | da |
| League | `(seasonId, sportdcLeagueId)` | da |
| Match | `sportdcMatchId` | da |
| LeagueStanding | `(leagueId, sportdcTeamId)` | da |
| SyncRun | — | log sync-a |
| Player | `slug` | da |
| MatchPlayer | `(matchId, playerId)` | da |
| User | `email` | da |
| Season | `name` | da |

### User

Admin nalozi. Nema javne registracije.

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| email | string, unique | login |
| passwordHash | string | bcrypt |
| role | enum `ADMIN` \| `EDITOR` | default `ADMIN` |
| createdAt / updatedAt | datetime | |

### Player

Source of truth: naša baza.

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| firstName / lastName | string | |
| birthYear | int, nullable | |
| jerseyNumber | int, nullable | |
| position | enum `GK` `DF` `MF` `WG` `FW` | Krilo = `WG` |
| image | string, nullable | URL |
| formerClubs | string, nullable | |
| slug | string, unique | transliteracija `ime-prezime` |
| active | boolean | default true |
| createdAt / updatedAt | datetime | |

Indeksi: `active`, `(lastName, firstName)`.

### Team

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| name | string | npr. FK Pobjeda Triješnica |
| logo | string, nullable | |
| city | string, nullable | |
| sportdcTeamId | int, unique | club id, npr. 8448 |
| sportdcName | string | kratko SportDC ime (`Pobjeda`) |
| isOurTeam | boolean | naš klub = 8448 |
| createdAt / updatedAt | datetime | |

Dva kluba `Borac` (7421 i 7802) ostaju odvojeni redovi.

### Season

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| name | string, unique | `2026-2027` |
| startDate / endDate | date, nullable | |
| active | boolean | seed gasi ostale aktivne |

### League

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| name | string | Prva Opštinska liga Bijeljina |
| seasonId | FK Season | `onDelete: Restrict` |
| sportdcLeagueId | int | `6452` za 2026-27 |
| sportdcUrl | string | |
| unique | `(seasonId, sportdcLeagueId)` | |

### Match

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| seasonId | FK Season | Restrict |
| leagueId | FK League | Restrict |
| homeTeamId / awayTeamId | FK Team | relacije `HomeMatches` / `AwayMatches` |
| sportdcMatchId | int, unique | npr. `604152` |
| date | datetime | |
| time | string, nullable | `17:30` |
| stadium | string, nullable | mjesto/grad sa SportDC-a |
| round | int | 0 = test/prijateljska u seedu |
| status | enum | `SCHEDULED` `LIVE` `FINISHED` `POSTPONED` `CANCELLED` |
| homeScore / awayScore | int, nullable | |

Indeksi: `(seasonId, round)`, `(leagueId, round)`, `date`, `(homeTeamId, awayTeamId)`, `status`.

### MatchPlayer / MatchGoal / MatchCard

Sastav i eventi **našeg** tima. `onDelete: Cascade` sa `Match`, `Restrict` sa `Player`.

`MatchGoal.assistPlayerId` je opciona relacija `Assists`. `ownGoal` (default false) nije gol igrača i ne nosi asistenciju.

`MatchPlayer.saves` / `penaltySaves` — golman, default 0, ne izmišljati.

`MatchPenaltyMiss` — promašen penal (igrač, minut).

`MatchConcededGoal` — minuta primljenog gola (protivnik), za clean sheet timing.

### FantasyScoringRule

Po sezoni. Unique `(seasonId, key)`. `points` je integer (može negativan). `active` isključuje pravilo iz obračuna (tada default iz koda).

### FantasyMatchPoints

Unique `(matchId, playerId)`. `points` + `breakdown` JSONB + `calculatedAt`. Cascade sa utakmicom, Restrict sa igračem.

JSONB: ključevi breakdown-a prate scoring rules bez migracije po novoj akciji. Upiti idu po `points`.

Detalji: [FANTASY.md](./FANTASY.md).

### ClubHistory

| Polje | Tip | Napomena |
| --- | --- | --- |
| id | cuid | PK |
| title | string | |
| body | text | |
| year | int, nullable | |
| sortOrder | int | |
| published | boolean | |

### SyncRun

Log SportDC sinhronizacije. Ne briše se pri grešci; admin čita posljednji SUCCESS.

| Polje | Tip | Napomena |
| --- | --- | --- |
| status | enum `RUNNING` `SUCCESS` `ERROR` | |
| startedAt / finishedAt | datetime | |
| errorMessage | text, nullable | |
| warningMessage | text, nullable | SportDC rezultat se promijenio na meču sa statistikom |
| teamsUpserted / matchesUpserted / standingsUpserted / roundsFetched | int | |

### LeagueStanding

Keš tabele sa SportDC-a. Unique `(leagueId, sportdcTeamId)`.

## Relacije

```
Season 1—n League
Season 1—n Match
League 1—n Match
League 1—n LeagueStanding
Team 1—n Match (home / away)
Match 1—n MatchPlayer  n—1 Player
Match 1—n MatchGoal    n—1 Player (scorer, assist)
Match 1—n MatchCard    n—1 Player
Match 1—n MatchPenaltyMiss n—1 Player
Match 1—n MatchConcededGoal
Match 1—n FantasyMatchPoints n—1 Player
Season 1—n FantasyScoringRule
User (standalone)
ClubHistory (standalone)
SyncRun (standalone)
```

## Seed

Idempotentan (`upsert` po unique ključevima):

```bash
npm run db:start    # lokalni embedded Postgres, ako nema Neon URL-a
npm run db:migrate
npm run db:seed
npm run db:smoke
```

Seed upisuje:

- sezonu `2026-2027` (aktivna)
- ligu `sportdcLeagueId: 6452`
- 14 klubova lige, uključujući FK Pobjeda Triješnica (`sportdcTeamId: 8448`, `isOurTeam: true`)
- 16 igrača (15 aktivnih + 1 neaktivan)
- 7 utakmica 1. kola (prave SportDC ID-jeve, uključujući `604152` Pobjeda–Borac 7802)
- 2 završene test utakmice (`800001`, `800002`) sa sastavom, golovima i kartonom
- admin korisnika iz `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dev default u `.env.example`)

Lozinka se ne commituje. Produkcija mora imati druge vrijednosti.

## Lokalno vs Neon

Ako u okruženju **nema** Neon kredencijala, development koristi embedded PostgreSQL 18 na `127.0.0.1:54329` (`.local-pg/`, gitignored). Ista schema radi na Neon-u: u `.env` zamijeniti `DATABASE_URL` i `DIRECT_URL` pooled/direct stringovima iz Neon Console.

## Migracije

Inicijalna: `prisma/migrations/20260817104414_init/`.
SportDC sync: `prisma/migrations/20260817105831_sportdc_sync_run/` (`SyncRun`, `LeagueStanding`).
Krilo: `prisma/migrations/20260817134500_position_wg/`.
Upozorenje pri promjeni rezultata: `prisma/migrations/20260817160000_sync_warning/`.
Fantasy Pobjeda: `prisma/migrations/20260817200000_fantasy_pobjeda/`.

Produkcija: `npm run db:deploy` (`prisma migrate deploy`) protiv `DIRECT_URL`.
