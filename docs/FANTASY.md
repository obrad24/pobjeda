# Fantasy Pobjeda

Bodovanje igrača FK Pobjeda Triješnica prema učinku u stvarnim utakmicama. Slično Fantasy Premier League, ali vezano samo za naš klub i naš identitet (navy / gold / crvena).

Ova faza implementira **player fantasy points + leaderboard + gameweek + season**. Nema korisničkih timova, budžeta, transfera, kapitena ni privatnih liga.

## Tok

```
Admin unosi statistiku utakmice
        ↓
MatchPlayer / MatchGoal / MatchCard / MatchPenaltyMiss / MatchConcededGoal
        ↓
lib/fantasy (scoring engine)
        ↓
FantasyMatchPoints (points + breakdown)
        ↓
/fantasy  ·  /igraci/[slug]  ·  /admin/fantasy
```

Admin **nikad** ne unosi „Fantasy bodovi = 12“. Unosi nastup, minute, gol, asistenciju, karton, autogol, promašen penal, odbrane, minute primljenih golova. Engine računa bodove.

Isti podaci utakmice uvijek daju isti rezultat (deterministički).

## Scoring rules (početno)

Pozicije kluba (`Player.position`) mapiraju se na fantasy pozicije:

| Klub | Fantasy |
| --- | --- |
| Golman (`GK`) | GK |
| Odbrana (`DF`) | DEF |
| Vezni (`MF`) | MID |
| Krilo (`WG`) | MID |
| Napadač (`FW`) | FWD |

| Akcija | GK | DEF | MID | FWD |
| --- | ---: | ---: | ---: | ---: |
| Nastup | +2 | +2 | +2 | +2 |
| Gol | +8 | +6 | +5 | +5 |
| Asistencija | +4 | +4 | +4 | +4 |
| Clean sheet | +4 | +4 | +2 | 0 |
| Promašen penal | −2 | −2 | −2 | −2 |
| Žuti karton | −1 | −1 | −1 | −1 |
| Crveni karton | −3 | −3 | −3 | −3 |
| Autogol | −2 | −2 | −2 | −2 |
| 3 odbrane GK | +1 | — | — | — |
| Odbranjen penal | +5 | — | — | — |

Vrijednosti žive u `FantasyScoringRule` po sezoni (`key`, `name`, `points`, `active`). Engine čita aktivna pravila; nedostajući ključ pada na default iz `lib/fantasy/rules.ts`. Promjena pravila + **RECALCULATE FANTASY POINTS** mijenja istoriju te sezone.

### Nastup

+2 ako je igrač u sastavu i ima `minutes > 0`. Ko nije nastupio ne dobija ništa (nema `MatchPlayer` / 0 minuta).

### Golovi i asistencije

Broje se iz `MatchGoal` (eventi imaju prednost). Autogol (`ownGoal: true`) **nije** gol igrača i **nema** asistenciju. Asistencija = `MatchGoal.assistPlayerId`.

### Clean sheet

- Najmanje 60 minuta.
- FWD: 0 bodova čak i ako uslov važi.
- Sub koji uđe nakon 60. minuta ne dobija CS (nema 60 minuta).
- Ako igrač izađe nakon 60+ minuta, a tim primi gol kasnije, CS ostaje.
- Minute primljenih golova: `MatchConcededGoal.minute`. Igrač je na terenu od ulaska (starter = 0) do izlaska (`substitutedAt` isključivo).
- Ako je SportDC `goalsAgainst > 0`, a minute nisu unesene (ili ih ima manje nego primljenih golova), CS se **ne** dodjeljuje — ne znamo kada je gol pao.

### Kartoni

- `YELLOW` → −1
- `RED` → −3
- `SECOND_YELLOW` → samo −3 (isključenje). Prethodni žuti u istoj utakmici se ne sabira (−1−3).
- Žuti pa pravi crveni (`YELLOW` + `RED`) ostaje −1 + −3.

### Golman

`MatchPlayer.saves` / `penaltySaves`. Nema izmišljenih odbrana: prazno = 0. Svake 3 odbrane = +1 (`floor(saves / 3)`).

## Gameweek i sezona

Fantasy kolo = `Match.round`. Prijateljske (`round = 0`) mogu imati bodove, ali se prikazuju kao „Prijateljska“.

Sezone se **ne** miješaju. Filter na `/fantasy`: `?sezona=` (Season id) i `?kolo=` (`sve` ili broj). Pravila i `FantasyMatchPoints` su vezani za sezonu utakmice.

## Recalculation

- Automatski nakon `saveMatchStatistics`.
- Ručno: `/admin/fantasy` → **RECALCULATE FANTASY POINTS** (`recalculateSeasonFantasy`).

Ako se naknadno promijeni rezultat, sastav, minutaža, gol, asistencija, karton ili penal, isti engine prepisuje `FantasyMatchPoints`.

## Modeli

### FantasyScoringRule

`seasonId`, `key`, `name`, `points`, `active`. Unique `(seasonId, key)`.

Ključevi: `appearance`, `goal_gk`, `goal_def`, `goal_mid`, `goal_fwd`, `assist`, `clean_sheet_gk`, `clean_sheet_def`, `clean_sheet_mid`, `clean_sheet_fwd`, `penalty_miss`, `yellow_card`, `red_card`, `own_goal`, `save`, `penalty_save`.

### FantasyMatchPoints

Po igraču i utakmici: `points`, `breakdown` (JSON), `calculatedAt`. Unique `(matchId, playerId)`.

`breakdown` je Prisma `Json` → PostgreSQL **JSONB** jer se ključevi bodovanja mogu širiti bez migracije po svakoj novoj akciji. Sortiranje i filteri idu po `points`, ne po unutrašnjim poljima JSON-a.

Primjer:

```json
{
  "appearance": 2,
  "goals": 5,
  "assists": 4,
  "cleanSheet": 2,
  "yellowCard": -1,
  "redCard": 0,
  "ownGoal": 0,
  "penaltyMiss": -2,
  "saves": 0,
  "penaltySave": 0,
  "total": 10
}
```

### MatchPenaltyMiss / MatchConcededGoal / MatchGoal.ownGoal / MatchPlayer.saves

Događaji za engine. Autogol nije običan gol. Primljene minute omogućuju CS pravilo „izašao pa gol“.

## Engine (`lib/fantasy/`)

Bodovi se **ne** računaju u React komponentama.

| Fajl | Uloga |
| --- | --- |
| `types.ts` | ulaz, breakdown, pozicije |
| `rules.ts` | default vrijednosti |
| `scoring.ts` | mapiranje pozicije i ključeva |
| `calculator.ts` | čisti obračun |
| `store.ts` | `FantasyScoringRule` u bazi |
| `recalculate.ts` | upis `FantasyMatchPoints` |
| `standings.ts` | tabela, kolo, profil |
| `display.ts` | labele breakdown-a |

Funkcije:

- `calculateMatchPlayerPoints()`
- `calculateMatchFantasy()`
- `calculatePlayerSeasonPoints()`
- `calculatePlayerGameweekPoints()`
- `getFantasyLeaderboard()`
- `getFantasyGameweekLeaderboard()`
- `getPlayerFantasyProfile()`
- `recalculateMatchFantasy()` / `recalculateSeasonFantasy()`

## Stranice

| Ruta | Šta |
| --- | --- |
| `/fantasy` | hero, sezona, POTR, top 3, posljednje kolo, tabela, forma |
| `/igraci/[slug]` | Fantasy sekcija: ukupno, prosjek, zadnje kolo, rang, istorija, grafikon |
| `/admin/fantasy` | pravila, tabela, breakdown, recalculate |
| `/admin/utakmice/[id]` | unos statistike uključujući autogol, penal, odbrane, primljene minute |

Navigacija: **Fantasy Pobjeda**. Desktop meni od `xl` zbog broja stavki.

## Future expansion

Kasije, bez mijenjanja ovog engine-a:

- nalog korisnika
- fantasy tim, budžet, kapiten / vicekapiten
- transferi
- privatne / javne lige
- ranking menadžera

Predloženi budući modeli (nije implementirano): `FantasyManager`, `FantasyTeam`, `FantasyPick`, `FantasyLeague`, `FantasyMembership`. Player points ostaju source of truth za timove.

## Testovi

`lib/fantasy/calculator.test.ts` — nastup, gol, asistencija, CS (GK/DEF/MID/FWD), <60 / 60+, sub poslije 60, CS nakon izlaska, nepoznate minute, penal, žuti, crveni, drugi žuti, autogol, više golova/asistencija, kombinacija iz specifikacije (MID 90 + CS + gol + as + žuti + penal = 10), nula minuta, recalculation determinizam.
