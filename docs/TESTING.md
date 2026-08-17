# Testiranje

## Nivoi

| Nivo | Šta | Kada |
| --- | --- | --- |
| Unit | parser Cheerio, `computeStandings`, slug, identifikacija kluba | Phase 3+ |
| Integration | Prisma upsert sync protiv test baze | Phase 4 |
| Component | tabela, kartica igrača, next match | Phase 5 |
| E2E | javne rute + login admin | Phase 8 |

Runner: Vitest (unit) + Playwright (E2E, `e2e/public.spec.ts`). CI: `.github/workflows/ci.yml` (test, lint, tsc; bez Neon-a).

## SportDC fixture-i

Ne gađati sportdc.net u CI na svaki commit.

Sačuvati **smanjene** HTML isječke u `lib/sportdc/__fixtures__/`:

- `league-6452-round1.html` — tabela 14 klubova + 1. kolo
- `finished-games.html` — 0:0, pobjeda sa skorom, kolo bez datuma

```bash
npm test
npm run ci          # vitest + eslint + tsc
npm run qa          # Phase 8: live SportDC, duplikati, workflow, score drift, outage, cron 401
npm run test:e2e    # Playwright: početna, liga, login redirect, 404, viewporti
npm run sportdc:sync
npm run backend:smoke
```

Testovi:

- parse 14 klubova, 8448 → our team
- dva Borac ID-a ostaju odvojena
- 604152 home=8448
- scheduled vs 0:0 draw (`n` + skorovi)
- `computeStandings`: 3 boda pobjeda, 1 neriješeno, sort: bodovi → GR → dati golovi → ime
- agregacija statistike: `MatchGoal`/`MatchCard` imaju prednost nad `MatchPlayer` brojačima; `SECOND_YELLOW` = žuti + crveni; autogol nije gol
- Fantasy scoring engine (`lib/fantasy/calculator.test.ts`)
- Zod: prazno ime, loš URL slike, prazan update, autogol bez asistencije

`npm run backend:smoke` (Neon): dohvat utakmica i tabele SportDC, raspored 1. kola, rezultati, create/update/deactivate/delete igrača (privremeni fixture, delete blokiran ako ima statistiku), CRUD istorije.

## Tabela

`computeStandings`: 3 boda pobjeda, 1 neriješeno, sort: bodovi → GR → dati golovi → ime. Ako se razlikuje od SportDC reda, logovati; ne „ispravljati“ SportDC.

## QA checklist (Phase 8)

- [x] `/` pokazuje sljedeću utakmicu (Playwright + `npm run qa`)
- [x] Tabela highlight 8448 (live parse + `/liga` E2E)
- [x] Mobile meni (Playwright 375/390)
- [x] `/igraci/[slug]` 404 UI za nepoznat slug (Next.js streamed `notFound()` može vratiti HTTP 200 uz 404 stranicu)
- [x] `/admin` redirect na login
- [x] Cron bez secret-a → 401
- [x] Sync ne prepisuje sastav (score-drift QA)
