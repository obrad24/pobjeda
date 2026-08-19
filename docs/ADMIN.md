# Admin panel

Samo autentifikovani korisnici sa ulogom `ADMIN`. Nema javnog signup-a. Javni header ne vodi na `/admin`.

## Rute

| Putanja | Namjena |
| --- | --- |
| `/login` | Auth.js Credentials forma |
| `/admin` | Dashboard: igrači, utakmice, sljedeća, zadnji rezultat, strijelac, sezona, sync |
| `/admin/igraci` | Lista, dodaj, uredi, deaktiviraj, obriši ako je sigurno, upload/URL fotografije |
| `/admin/utakmice` | Sve / naredne / odigrane; detalj i unos sastava samo za naše mečeve |
| `/admin/fantasy` | Scoring rules, tabela, breakdown, **RECALCULATE FANTASY POINTS** |
| `/admin/liga` | SportDC izvor, URL, ID, sezona, status, greška; **SINHRONIZUJ SADA** |
| `/admin/sezone` | Dodavanje, uređivanje, aktiviranje, deaktiviranje |
| `/admin/istorija` | CRUD unosa istorije kluba |
| `/admin/podesavanja` | Liga URL/ID iz env (read-only) + status tajni |

## Ovlaštenja

Admin mora moći:

- dodati / urediti / deaktivirati igrača
- obrisati igrača samo ako nema `MatchPlayer` / `MatchGoal` / `MatchCard` / `MatchPenaltyMiss` / `FantasyMatchPoints`
- uploadovati fotografiju (Vercel Blob) ili unijeti URL
- vidjeti utakmice iz SportDC sync-a
- unijeti sastav (starteri, izmjene, minute), golove, asistencije, kartone, autogol, promašen penal, odbrane, minute primljenih golova
- **ne** unijeti fantasy bodove ručno — sistem ih računa
- pregledati i preračunati fantasy (`/admin/fantasy`)
- uređivati istoriju kluba
- pokrenuti SportDC sync (`triggerSportDcSync`, isti pipeline kao cron)

Admin **ne** edituje SportDC rezultat ručno. Rezultat je sync polje.

## Auth tok

1. Auth.js v5 Credentials: email + lozinka
2. `authorize` poredi bcrypt hash iz `User` i pušta samo `role === ADMIN`
3. Session JWT sadrži `role` (`httpOnly`, `secure` u produkciji)
4. `proxy.ts` (Next 16, umjesto `middleware.js`) preusmjerava `/admin` na `/login` bez sesije
5. `app/admin/layout.tsx` zove `requireAdmin()` (sesija + ponovna provjera `User` u bazi)
6. Svaka Server Action zove `requireAdmin()` — frontend gate nije dovoljan

Prvi korisnik: seed iz `ADMIN_EMAIL` / `ADMIN_PASSWORD` (samo development). Produkcija: `AUTH_SECRET` obavezan.

## UX

- Navy sidebar + cream sadržaj; hamburger na uskim ekranima
- Loading skeleton (`app/admin/loading.tsx`), error boundary, empty states
- Success toast (`?toast=`), inline error na formama
- Confirm prije deaktivacije, brisanja, sync-a
- Zod validacija na serveru; pending stanja na dugmadima
- Sync dugme disable dok traje (`RUNNING`)

## Upload fotografija

`Player.image` je URL. Lokalno se fajl snima u `public/uploads/players`. U produkciji upload ide na Vercel Blob (`BLOB_READ_WRITE_TOKEN`): JPEG/PNG/WebP/GIF, max 4 MB. Bez tokena na Vercel-u ostaje ručni URL.
