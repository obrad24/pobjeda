# SportDC integracija

Analiza urađena **17.08.2026.** nad stvarnim HTML-om (HTTP 200, `text/html; charset=UTF-8`), ne nad pretpostavkama. Playwright **nije potreban**.

## Izvor

| | |
| --- | --- |
| Liga (source of truth) | https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina |
| Sezona | 2026-2027 |
| SportDC liga ID | `6452` |
| Takmičenje | Prva Opštinska liga Bijeljina |
| Kola | 26 (14 klubova × 26 kola = 182 utakmice) |
| Početak rasporeda | 1. kolo, nedjelja 23.08.2026. 17:30 |
| Naš klub | FK Pobjeda Triješnica |
| SportDC club ID | **8448** (stabilan) |
| SportDC kratko ime | `Pobjeda` |
| Grad | `Triješnica` |
| Club URL | https://sportdc.net/club/8448-pobjeda |
| Club URL (slug varijanta) | https://sportdc.net/club/8448-pobjeda-trijesnica |

Na tabeli stoji **Pobjeda** + grad **Triješnica**, ne puni naziv „FK Pobjeda Triješnica“. Identifikacija ide preko `8448`.

## Da li postoji API?

**Ne.** Provjereno:

- Nema JSON REST endpointa u HTML-u / script src listi
- `/widget/league/6452`, `/embed/league/6452`, `/iframe/league/6452`, `/ps/embed/6452` → **404 stranica** (HTTP 200 sa title „Strana ne postoji“)
- Embed modal `#ps-embed-popup` postoji, ali `<textarea class="embed-code">` je **prazan** u SSR HTML-u (popunjava se JS-om na klik „Dodajte tabelu/rezultate na Vaš sajt“)
- SportDC javno nudi besplatni embed za klubove; to nije programatski JSON API

Živi skor ide preko MQTT/socket skripti (`/js/mqtt.js`). Za naš sync to **nije** izvor.

## SSR ili JavaScript?

**Server-side HTML.** `curl` bez JS-a vraća punu tabelu, kola, JSON-LD i linkove klubova. Stranica ~538 KB.

`/league/6452-.../standings`, `/games`, `/teams` vraćaju **isti šablon** kao glavna stranica lige (ista tabela + trenutno kolo). Za parser koristiti:

1. `GET {SPORTDC_LEAGUE_URL}` — tabela + trenutno kolo
2. `GET {SPORTDC_LEAGUE_URL}/round/{n}` — utakmice kola `n` (potvrđeno: kolo 1 i kolo 2 imaju različite `data-id`)

Navigacija kola u UI-u zove `SF.a(..., switchRound(n))`, ali `/round/{n}` je dovoljan SSR ulaz. Ne treba emulirati njihov AJAX.

## robots.txt

`https://sportdc.net/robots.txt` **dozvoljava** `/league/`, `/club/`, `/game/`. Disallow: `/css/`, `/js/`, `/lib/`, `/panel/`, `/media/`, `/static/`, `/error`, `/forbidden`.

Sync smije gađati samo javne stranice lige/kola/utakmice. Pauza između zahtjeva (npr. 400–800 ms). Identifikovati se razumnim User-Agentom klupskog sajta.

## HTML — tabela

```html
<table class="tab ssnet-table" league="6452" round="1" layout="standings" sport="football">
  <thead> Poz, PROG, Tim, Utak, Pob, Ner, Por, DG, PG, GR, Bod </thead>
  <tbody class="data">
    <tr tid="3" data-club-id="8448">
      <td class="poz">… <span class="pos-deleg">3</span></td>
      <td class="col-TIM">
        <a class="team-wrapper" href="/club/8448-pobjeda">
          <div class="team-name">Pobjeda</div>
          <div class="team-city">Triješnica</div>
        </a>
      </td>
      <td class="col-UTAKM">0</td> <!-- odigrane -->
      <td class="col-POB">0</td>
      <td class="col-NER">0</td>
      <td class="col-POR">0</td>
      <td class="col-DG">0</td>
      <td class="col-PG">0</td>
      <td class="col-GR">0</td>
      <td class="bod sc pts"><div class="pts-wrapper">0</div></td>
    </tr>
  </tbody>
</table>
```

Kolone: pozicija, klub, utakmice, pobjede, neriješene, porazi, dati golovi, primljeni golovi, gol razlika, bodovi.

`tid` je redni broj u tabeli (pozicija na startu sezone), **nije** stabilan ID. Stabilan ID je `data-club-id`.

## HTML — raspored / rezultati

Svaka utakmica:

```html
<div role="link" class="... game-row ..." data-id="604152"
     onclick="location.href='/game/604152-pobjeda-borac'">
  <script type="application/ld+json">SportsEvent … startDate, location</script>
  <div data-res="n">
    <div>23.08.2026</div><div>17:30</div>
    <div class="team-host">Pobjeda</div>
    <div class="team-guest">Borac</div>
    <!-- SCHEDULED: .game-notif (zvono), nema skorova -->
    <!-- FINISHED: .res-host / .res-guest sa brojevima -->
  </div>
</div>
```

Markup se **duplicira** u HTML-u (dva layouta). Parser deduplikuje po `data-id`.

JSON-LD `SportsEvent`:

- `url`: `https://sportdc.net/game/{id}-{slug}`
- `startDate`: ISO sa zonom, npr. `2026-08-23T17:30:00+02:00`
- `location.name` / `addressLocality`: mjesto (npr. `Triješnica`), **nije** naziv stadiona
- `homeTeam.name` / `awayTeam.name`: kratka imena

Na stranici utakmice dodatni JSON-LD vezuje klubove:

- Pobjeda → `/club/8448-pobjeda`, logo `/img/team/60367/100`
- protivnik Borac u 1. kolu → `/club/7802-borac` (Ugljevička Obrijež), **ne** `7421` (Trnjaci)

`60367` je sezonski team-image ID, nije club ID. U bazi čuvati **club id**.

### Status i rezultat

| Signal | Značenje |
| --- | --- |
| `.game-notif` / zvono, nema `.res-host` | nije odigrano (`SCHEDULED`) |
| `.res-host` + `.res-guest` sa brojevima | odigrano (`FINISHED`) |
| `data-res="1"` + skorovi | pobjeda domaćina |
| `data-res="2"` + skorovi | pobjeda gosta |
| `data-res="n"` + skorovi (npr. 0:0) | neriješeno |
| `data-res="n"` **bez** skorova | nije odigrano |

**Ne** koristiti `data-res="n"` samo kao „nije odigrano“. Na završenoj sezoni 2025-26, 0:0 je `data-res="n"` **sa** prikazanim 0 i 0.

## Klubovi sezone 2026-2027 (liga 6452)

| sportdcId | sportdcName | Grad | Club path |
| ---: | --- | --- | --- |
| 7391 | Majevica | Donje Zabrđe | `/club/7391-majevica` |
| 7594 | Tavna | Banjica | `/club/7594-tavna` |
| **8448** | **Pobjeda** | **Triješnica** | `/club/8448-pobjeda` |
| 7610 | Nacional | Bijeljina | `/club/7610-nacional` |
| 8265 | Sinđelić | Golo Brdo | `/club/8265-sindjelic` |
| 10247 | OFK Crnjelovo | Gornje Crnjelovo | `/club/10247-ofk-crnjelovo` |
| 7421 | Borac | Trnjaci | `/club/7421-borac` |
| 7599 | Modran | Modran | `/club/7599-modran` |
| 11611 | Patkovača | Patkovača | `/club/11611-patkovaca` |
| 7579 | Ljeljenča | Ljeljenča | `/club/7579-ljeljenca` |
| 7587 | Stević Jovan | Vršani | `/club/7587-stevic-jovan` |
| 7802 | Borac | Ugljevička Obrijež | `/club/7802-borac` |
| 7596 | Glogovac | Glogovac | `/club/7596-glogovac` |
| 7580 | Jedinstvo | Donja Čađavica | `/club/7580-jedinstvo` |

Dva **Borac** kluba. Match isključivo po `sportdcId`.

## 1. kolo (23.08.2026. 17:30) — naša utakmica

| sportdcMatchId | Domaćin | Gost | Mjesto |
| ---: | --- | --- | --- |
| 604150 | Majevica (7391) | Jedinstvo (7580) | Donje Zabrđe |
| 604151 | Tavna (7594) | Glogovac (7596) | Banjica |
| **604152** | **Pobjeda (8448)** | **Borac (7802)** | **Triješnica** |
| 604153 | Nacional (7610) | Stević Jovan (7587) | Bijeljina |
| 604154 | Sinđelić (8265) | Ljeljenča (7579) | Golo Brdo |
| 604155 | OFK Crnjelovo (10247) | Patkovača (11611) | Gornje Crnjelovo |
| 604156 | Borac (7421) | Modran (7599) | Trnjaci |

2. kolo ima ID-jeve `604157`–`604163` (potvrđeno SSR-om `/round/2`).

## Identifikacija našeg kluba

Redoslijed:

1. `data-club-id` / club URL broj **8448** (`SPORTDC_CLUB_ID`)
2. Fallback: normalizovan string koji sadrži i `pobjeda` i `trijesnica`/`triješnica` (ukloniti dijakritike)
3. Nikad samo `Pobjeda` ili samo `Borac`

## Implementacija (Phase 3)

Kod: `lib/sportdc/` (`client`, `parser`, `league`, `teams`, `matches`, `standings`, `sync`, `types`).

| Funkcija | Uloga |
| --- | --- |
| `getLeague` / `getTeams` / `getStandings` / `getMatches` | čitanje sa SportDC (nije za page load) |
| `getUpcomingMatches` / `getCompletedMatches` | filter statusa |
| `syncSportDCLeague` / `triggerSportDcSync` | upsert u Neon |
| `GET /api/cron/sportdc-sync` | Vercel Cron, `Authorization: Bearer CRON_SECRET` |

Javne stranice **ne** zovu SportDC. Čitaju Neon.

Mapiranje klubova na utakmici: CSS `--index` na `.team-img` = redni broj u tabeli (0-based). Pobjeda je index 2 → `8448`. Gost u 1. kolu index 11 → `7802` (Borac Ugljevička Obrijež), ne 7421.

Kola 14–26 na SportDC trenutno **nemaju** `startDate` ni datum u HTML-u. Parser ih i dalje upisuje; datum se procjenjuje kao `2026-08-23 17:30 + (kolo-1) nedjelja` dok SportDC ne objavi tačno vrijeme.

Sync:

1. Fetch liga (tabela + trenutno kolo)
2. Ako je 0 timova — prekid, **ništa se ne briše**
3. Upsert Season, League, Team, LeagueStanding, Match po SportDC ID-jevima
4. Fetch ostala kola u batch-evima po 4 (Vercel `maxDuration = 60`)
5. Naš klub: `sportdcTeamId === 8448` → ime ostaje **FK Pobjeda Triješnica**, `isOurTeam = true`
6. `SyncRun` bilježi SUCCESS/ERROR, brojače, poruku i `warningMessage` ako se rezultat promijenio na meču sa unesenom statistikom (sastav ostaje).
7. Ako je sync već RUNNING < 2 min → 409
8. MatchPlayer / MatchGoal / MatchCard / Player / ClubHistory se ne diraju

Pokretanje:

```bash
npm test
npm run sportdc:sync
```

Verifikovano 17.08.2026. na Neon-u: 14 klubova, 14 redova tabele, 182 utakmice, 26 utakmica Pobjede, `604152` Pobjeda–Borac 7802 SCHEDULED.

Ne upisivati igrače, golove naših igrača, ni istoriju kluba iz SportDC-a.

## Prethodna sezona (kontekst, nije sync target)

2025-2026: liga `5995` (Prva Opštinska liga – Bijeljina – Istok). Pobjeda 7. mjesto, 30 bodova. Club ID ostaje `8448`. Koristi se samo kao referenca za HTML rezultata (`game-res-1/2/n`). Javni sajt ne vuče tu ligu osim ako se kasnije eksplicitno zatraži arhiva.

## Rizici

- SportDC može promijeniti klase; parser testovi na HTML fixture-ima
- Liga ID se mijenja svake sezone — `SPORTDC_LEAGUE_ID` / URL su env, admin ih može izmijeniti
- Kratka imena nisu jedinstvena
- Stadion: čuvati `location` kao `stadium` polje uz napomenu da je to mjesto/grad
- Live MQTT se ne koristi; cron na 15–30 min je dovoljan za ovu ligu
