# Checkmate Ultra

A local‑services marketplace (Sulekha‑style): residents find and hire trusted local
service providers and businesses; providers get matched with customer enquiries.

Built module by module. **Module 1 — Public directory & search** is live in this build.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4, hand‑rolled components, lucide-react icons |
| Data | Prisma ORM — SQLite for local dev now, Postgres later |
| Validation | Zod |

> Full target architecture (NestJS API, Meilisearch, Redis/BullMQ, Razorpay, etc.)
> is in the project blueprint. This app starts as a Next.js full‑stack build and
> the API is extracted in a later phase.

## Getting started

```bash
npm install
npm run db:reset      # creates prisma/dev.db + seeds 12 categories, 2 cities, ~78 providers
npm run dev           # http://localhost:3000
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Sync schema to the database |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Force‑reset schema + reseed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | ESLint |

## What module 1 covers

- Home page: hero search, category grid, featured providers, popular localities
- `/[category]` → redirects to the selected city
- `/[category]/[city]` — provider listing with sort / rating / locality filters + sticky enquiry form
- `/[category]/[city]/[locality]` — deep locality listing
- `/business/[slug]` — provider profile: photos, services & pricing, ratings breakdown, reviews, enquiry
- `/search` — cross‑category search with filters
- `/get-quotes` — standalone requirement form
- API route handlers: `GET /api/providers`, `POST /api/leads` (+ `GET /api/leads`)
- City selection persisted in a cookie (`ck_city`)

Auth, provider onboarding/dashboard, reviews collection, billing and the admin
console are later modules.

## Moving to Postgres (later)

1. `docker compose up -d`
2. In `.env`, switch `DATABASE_URL` to the Postgres line
3. In `prisma/schema.prisma`, set `datasource db { provider = "postgresql" }`
4. `npm run db:reset`

## Notes

- Requires Node ≥ 20.11. Prisma is pinned to v6 for this reason; bump to v7 after
  upgrading to Node 22.
- SQLite keeps the schema free of native enums and scalar arrays so the Postgres
  switch is mechanical.
