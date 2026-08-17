# Arhitektura — FK Pobjeda Triješnica

Web aplikacija kluba. Javni sajt čita ligu sa SportDC-a (preko naše baze), a igrače, sastave i klupsku statistiku vodi klub u Neon bazi.

**Stack:** Next.js `16.3.1` (App Router), React `19.2.8`, TypeScript, Tailwind CSS `v4`, ESLint, Vercel, Neon PostgreSQL, Prisma ORM `7.9`.

Ne koristiti Supabase, Firebase, MongoDB, Railway ili Render.

## Tok podataka

```
SportDC (liga, tabela, raspored, rezultati, klubovi)
        │
        │  fetch + Cheerio  (Vercel Cron / admin sync)
        ▼
Next.js server  →  SportDC parser  →  Neon PostgreSQL
        │
        ▼
Javni sajt (Server Components) + Admin (Server Actions)
```

Dva izvora istine se ne miješaju:

| SportDC → Neon (sync) | Neon (ručno / admin) |
| --- | --- |
| Liga, sezona, klubovi | Igrači, fotografije, slugovi |
| Raspored i rezultati | Sastavi, minute, golovi naših igrača |
| Tabela (računata iz rezultata) | Asistencije, kartoni |
| | Istorija kluba |
| | Fantasy bodovi (izračun iz statistike) |

## Slojevi

| Sloj | Tehnologija | Uloga |
| --- | --- | --- |
| UI | React Server Components + Client Components | Stranice, navigacija, forme |
| Mutacije | Server Actions | Admin CRUD, ručni sync |
| HTTP | Route Handlers (`app/api/...`) | Cron, auth callbacki |
| ORM | Prisma | Schema, migracije, upiti |
| Baza | Neon PostgreSQL | Trajni podaci |
| Hosting | Vercel | App, Cron, env |
| Integracija | `lib/sportdc/` | Fetch, parse, upsert |

## Next.js App Router

- **Server Components (default):** početna, liga, rezultati, igrači, statistika, istorija. Čitaju Prisma na serveru. Bez `use client` osim gdje treba interaktivnost.
- **Client Components:** mobilni meni, admin forme, tabovi, lightbox. Tanki: UI stanje, ne pristup bazi.
- **Server Actions:** kreiranje/izmjena igrača, sastav, statistika utakmice, pokretanje sync-a, istorija. `use server`, validacija, auth provjera.
- **Route Handlers:**
  - `GET /api/cron/sportdc-sync` — Vercel Cron, zaštićen `CRON_SECRET`
  - Auth.js rute (`/api/auth/[...nextauth]` ili Auth.js v5 ekvivalent)

Nema zasebnog Express/Fastify backend-a.

## Predviđena struktura

```
app/
  layout.tsx                 # root: fontovi, Header, Footer
  page.tsx                   # /
  igraci/page.tsx
  igraci/[slug]/page.tsx
  statistika/page.tsx
  fantasy/page.tsx
  liga/page.tsx
  rezultati/page.tsx
  utakmice/[id]/page.tsx
  istorija/page.tsx
  admin/
    layout.tsx               # auth gate
    page.tsx
    igraci/
    utakmice/
    liga/
    fantasy/
    sezone/
    istorija/
    podesavanja/
  api/
    cron/sportdc-sync/route.ts
    auth/[...nextauth]/route.ts
  login/page.tsx
components/
  layout/                    # Header, Footer, MobileNav
  home/                      # NextMatch, LastResults, ...
  league/                    # StandingsTable, FixturesList
  players/                   # PlayerCard, PlayerProfile
  match/                     # MatchHeader, Lineup, Events
  admin/                     # forme i tabele
  ui/                        # Button, Card, Badge
lib/
  db/prisma.ts               # PrismaClient + PrismaPg adapter
  context.ts                 # aktivna sezona, naš tim, liga
  players/                   # CRUD igrača
  matches/                   # Neon upiti utakmica (javni sajt)
  stats/                     # agregacije iz MatchPlayer/Goal/Card
  fantasy/                   # scoring engine, leaderboard, recalculate
  league/                    # tabela, raspored, rezultati
  validation/                # Zod šeme
  sportdc/                   # Cheerio parser + sync (ne page load)
  utils/slug.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
generated/prisma/            # Prisma Client (gitignore, prisma generate)
scripts/
  db-smoke.ts
  backend-smoke.ts
  start-local-postgres.ts
public/
docs/
TASKS.md
prisma.config.ts             # DIRECT_URL za CLI (Prisma 7)
```

Phase 2 je dodala Prisma schemu, migraciju, seed i `lib/db/prisma.ts`. Javne stranice i SportDC parser dolaze u kasnijim fazama.

## Rendering i keš

- Javne stranice: Server Components, `revalidate` (npr. 60–300 s) ili `unstable_cache` oko Prisma upita.
- Nakon cron/admin sync-a: `revalidateTag` / `revalidatePath` za ligu, rezultate i početnu.
- Admin: `dynamic = "force-dynamic"`, bez keša.

## Autentikacija

Auth.js (NextAuth v5) sa Credentials providerom.

- `User.email` + `User.passwordHash` (bcrypt) u Neon bazi.
- Uloga: `ADMIN` (proširivo kasnije: `EDITOR`).
- JWT session (bez dodatnog adaptera na startu).
- `/admin/*` zaštićen u `proxy.ts` + `app/admin/layout.tsx` + `requireAdmin()` na mutacijama.
- Server Actions i cron ne smiju vjerovati samo UI-u.

Detalji: [ADMIN.md](./ADMIN.md), [SECURITY.md](./SECURITY.md).

## SportDC integracija

Nema javnog JSON API-ja. Stranice lige su **server-side HTML** (`text/html`). Parser: `fetch` + Cheerio. Playwright nije potreban.

Identifikacija našeg kluba: `SPORTDC_CLUB_ID=8448` (`Team.sportdcTeamId`), ne exact string.

Detalji: [SPORTDC.md](./SPORTDC.md).

## Dizajn

Tailwind v4 `@theme` tokeni u `app/globals.css` (nema `tailwind.config.js` u ovom scaffoldu).

Glavna kombinacija: **gold + navy**. Crvena samo kao diskretan akcent. Mobile-first.

Detalji: [FRONTEND.md](./FRONTEND.md).

## Hosting

Jedan Vercel projekat + jedna Neon baza. Prisma 7: `DATABASE_URL` (pooled, runtime adapter) i `DIRECT_URL` (migracije u `prisma.config.ts`). Cron: `vercel.json`.

Detalji: [DEPLOYMENT.md](./DEPLOYMENT.md).
