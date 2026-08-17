# FK Pobjeda Triješnica

Web sajt fudbalskog kluba. Next.js (App Router), TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL, Vercel. Liga, tabela i raspored dolaze sa [SportDC](https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina).

## Stanje

Phase 2 (baza) je gotova. SportDC parser je sljedeći korak.

- Task tracker: [TASKS.md](./TASKS.md)
- Arhitektura: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Baza: [docs/DATABASE.md](./docs/DATABASE.md)
- SportDC analiza: [docs/SPORTDC.md](./docs/SPORTDC.md)

## Lokalno

Node 22 (`.nvmrc`):

```bash
nvm use
cp .env.example .env
npm install
npm run db:start    # ako još nemaš Neon URL — ostavi ovaj terminal otvoren
npm run db:migrate
npm run db:seed
npm run db:smoke
npm test
npm run sportdc:sync
npm run dev
```

Za Neon: u `.env` stavi pooled `DATABASE_URL` i direct `DIRECT_URL` iz Neon Console, zatim `npm run db:deploy` i `npm run db:seed`.

Env varijable su opisane u `.env.example`. Tajne ne commitovati.
