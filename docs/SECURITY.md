# Sigurnost

## Auth

- Lozinke samo kao bcrypt hash u `User.passwordHash`
- Auth.js Credentials; nema registracije sa sajta
- `AUTH_SECRET` obavezan u produkciji (Auth.js baca grešku ako fali)
- Session JWT, `httpOnly` cookie, `secure` u produkciji, `sameSite=lax`
- Gate na tri nivoa: `proxy.ts` (cookie/JWT), `app/admin/layout.tsx`, `requireAdmin()` u svakoj mutaciji
- `requireAdmin()` ponovo čita `User` iz Neon-a — uloga se ne vjeruje samo klijentu ni samo JWT-u
- Javne rute ne izlažu admin akcije; header nema link na `/admin`

## Cron

- `CRON_SECRET` u `Authorization: Bearer`
- Poređenje timing-safe (`crypto.timingSafeEqual`)
- Bez secret-a u query parametrima i u JSON odgovoru

## Env i tajne

- `.env*` u gitignore; `.env.example` bez vrijednosti
- Neon URL, `AUTH_SECRET`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` samo u Vercel/Neon dashboardu
- Admin `/podesavanja` pokazuje samo da li je tajna postavljena, ne vrijednost
- Nema `NEXT_PUBLIC_*` tajni; cron/auth secret ostaju na serveru
- `app/robots.ts` zabranjuje indeksiranje `/admin`, `/login`, `/api/`
- Ne logovati HTML odgovore SportDC-a u produkciji (veliki PII-ish dump)

## Ulaz

- Zod validacija svih Server Actions
- Slug: dozvoljeni znakovi, unique constraint
- Upload: samo slike, max 4 MB, Blob URL a ne arbitrary HTML
- XSS: React default escaping; istorija se čuva kao običan tekst (`stripHtmlTags`), ne sirovi HTML

## SportDC

- Samo javni GET na `/league/` i `/round/`
- Poštovati `robots.txt` (ne dirati `/panel/`, `/js/`)
- Rate limit između kola
- Ne slati kolačiće korisnika ka SportDC-u
- Admin sync koristi isti servis kao cron; ne dira Player / MatchPlayer / MatchGoal / MatchCard / ClubHistory

## Prisma

- Nema `prisma db push` u produkciji kao zamjena za migracije
- Query samo kroz Prisma, ne interpolacija SQL stringova
- Brisanje igrača je zabranjeno dok postoje vezani eventi (`onDelete: Restrict` + servisna provjera)
