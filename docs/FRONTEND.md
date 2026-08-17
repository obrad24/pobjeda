# Frontend — javni sajt

Jezik UI-a: bosanski (ijekavica). `lang="sr-Latn"` na `<html>`.

Mobile-first. Gold + navy kao glavna kombinacija. Crvena samo diskretno. Nema generičkog zelenog fudbalskog dizajna.

## Rute (implementirano)

| Putanja | Stranica |
| --- | --- |
| `/` | Početna: sljedeći meč, zadnja 3, statistika, sastav, tabela |
| `/igraci` | Aktivni igrači po pozicijama |
| `/igraci/[slug]` | Profil + sezonski agregat + Fantasy sekcija + lista nastupa |
| `/statistika` | Tabela, sortiranje preko `?sort=` |
| `/fantasy` | Fantasy Pobjeda: sezona, kolo, tabela, igrač kola |
| `/liga` | Naziv lige, sezona, tabela (gold red Pobjede), naredne utakmice |
| `/rezultati` | Naredne / odigrane, filter `?kolo=` |
| `/utakmice/[id]` | Detalj (naš ID). Sastav i eventi samo za naše mečeve |
| `/istorija` | Hronologija iz `ClubHistory` (admin: `/admin/istorija`) |

Nepoznat slug ili ID utakmice → `not-found`. Neaktivni igrači nisu na `/igraci`.

## Početna (`/`) — redoslijed sekcija

1. **Sljedeća utakmica** — prva naredna FK Pobjeda (`getUpcomingMatches`). Navy hero, gold detalji, bijeli tekst, crveni 2px top border. Domaćin/gost, grbovi (ili inicijali), datum, vrijeme, kolo, takmičenje, stadion.
2. **Posljednja 3 meča** — protivnik, domaćin/gost, rezultat, datum, kolo. Vizuelno: pobjeda gold, neriješeno navy, poraz crveni.
3. **Statistika igrača** — top strijelci / asistencije / nastupi. Prazno stanje dok nema `MatchPlayer` unosa.
4. **Sastav** — kartice aktivnih igrača.
5. **Tabela lige** — puna tabela, gold highlight našeg reda.

Prazna stanja: sezona još nije krenula — raspored i tabela sa SportDC keša, bez lažnih rezultata lige. Seed prijateljske (kolo 0) mogu biti u „posljednja 3“.

## Header / Footer

- Header: server (`components/layout/Header.tsx`) + klijentski `SiteNav` (desktop active state + hamburger).
- Navy header, logo lijevo, gold underline na aktivnoj stavci.
- Mobile: full-screen navy panel, Escape zatvara, lock scroll.
- Footer: navy-dark, gold detalji, crveni top border, credit SportDC.

## Tabela

- Navy header, bijeli tekst kolona.
- Red FK Pobjeda: gold pozadina.
- Mobilno: horizontalni scroll (`.table-scroll`), statistika ima sticky kolonu igrača.

## Kartice igrača

- Svijetla pozadina, navy tekst, gold broj dresa.
- Border navy, hover gold.
- Nema fotografije → navy placeholder sa brojem. `next/image` kad postoji URL.

## Stranica utakmice

- Hero: kolo, liga, datum, vrijeme, stadion, par, rezultat ili „vs“.
- Naša utakmica: golovi/asistencije, kartoni, sastav, minute, izmjene.
- Tuđa ligaška utakmica: samo par/rezultat, bez lažnog sastava.

## Dizajn tokeni (`app/globals.css` `@theme`)

| Token | Hex | Upotreba |
| --- | --- | --- |
| `gold` | `#C89A32` | primary, brojevi, aktivni nav |
| `gold-light` | `#D8AF4A` | hover |
| `gold-dark` | `#A8791F` | border, pressed |
| `navy` | `#172B4D` | header, tabela head, naslovi |
| `navy-dark` | `#0D1B2F` | footer, hero |
| `red` | `#C62828` | akcent linije, poraz |
| `red-dark` | `#991B1B` | hover akcent |
| `white` | `#FFFFFF` | |
| `cream` | `#F7F4EA` | page background |
| `ink` | `#111827` | |
| `muted` | `#64748B` | sekundarni tekst |

Hero ima tanke dijagonalne gold hairline linije (nije kopija teksture dresa).

Font: Geist (latin + latin-ext) za tekst, Barlow Condensed (`font-display`) za brojeve i naslove. Tabular nums na rezultatima.

## Komponente

```
components/layout/Header.tsx          # server
components/layout/SiteNav.tsx         # client
components/layout/Footer.tsx
components/home/NextMatch.tsx
components/home/RecentResults.tsx
components/home/HomeStats.tsx
components/league/StandingsTable.tsx
components/league/FixturesList.tsx
components/players/PlayerCard.tsx
components/players/StatsTable.tsx
components/match/MatchDetail.tsx
components/ui/Section.tsx
components/ui/TeamCrest.tsx
components/admin/AdminNav.tsx
components/admin/AdminToast.tsx
components/admin/PlayerForm.tsx
components/admin/MatchStatsForm.tsx
components/fantasy/FantasyLeaderboard.tsx
components/fantasy/PlayerOfTheRound.tsx
components/fantasy/FantasyFormChart.tsx
components/fantasy/FantasyBreakdownList.tsx
```

## Data fetching

Sve javne stranice su Server Components. Čitaju `lib/players`, `lib/matches`, `lib/stats`, `lib/league`, `lib/history`, `lib/fantasy`. Nema Prisma u Client Components.

ISR: `revalidate = 120` na početnoj, igračima, ligi, utakmici; 300 s na istoriji. `/statistika`, `/rezultati` i `/fantasy` su dinamični zbog `searchParams`.

SEO: `app/sitemap.ts` (javne rute + slugovi igrača), `app/robots.txt` via `app/robots.ts` (disallow `/admin`, `/login`, `/api/`). Root metadata: title template, description, Open Graph, Twitter summary. Profil igrača: `generateMetadata` + `/igraci/{slug}`.

## Responsive

Provjereno layoutom (375 / 390 / 768 / 1024 / 1440):

- 375–390: hamburger, 2 kolone igrača, hero stacked, tabele sa horizontalnim scrollom, kola-filter scroll. `/fantasy` tabela postaje kartice (igrač, pozicija, ukupno, prosjek, forma).
- 768: 3 kolone kartica, zadnja 3 meča u nizu.
- 1280+: desktop nav (hamburger do `xl` zbog stavke Fantasy Pobjeda), 4 kolone sastava, hero 3 kolone (domaćin / vs / gost).

## Pristupačnost

- Kontrast gold na navy
- Fokus ring gold
- `aria-expanded` / dialog na mobilnom meniju
- Pravi `<table>` za tabelu i statistiku
