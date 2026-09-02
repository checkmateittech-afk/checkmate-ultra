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

Billing and the matching/credit engine are later modules.

## What module 2 covers — Auth

- Phone‑OTP sign in (`/login`): number → 6‑digit code → session. Account is
  created automatically on first verify. In dev the code is logged to the server
  and shown on screen (no SMS provider wired yet).
- Signed session in an httpOnly JWT cookie (`ck_session`, `jose`, HS256, 30d).
- `middleware.ts` guards `/account` (any user), `/dashboard` (provider/admin),
  `/admin` (admin/moderator) — redirects to `/login?next=…` or `/account`.
- `/account` page: edit name/email, view your posted requirements.
- Header shows a user menu when signed in; enquiries attach `userId` when logged in.
- API: `POST /api/auth/otp/start`, `POST /api/auth/otp/verify`,
  `POST /api/auth/logout`, `GET|PATCH /api/auth/me`.
- Rate limiting on OTP: 30s between sends, 5 per 15 min, 5 verify attempts.
- Seeded users: `+91 90000 00001` (ADMIN), `+91 90000 00002` (MODERATOR),
  `+91 98888 00001` (CONSUMER). Set `AUTH_SECRET` in `.env`.

## What module 3 covers — Provider onboarding & dashboard

- `/business/join`: 3‑step wizard (business details → service & location → review).
  On submit: creates the Provider (`status = ACTIVE`, self‑serve for now), makes the
  user a `PROVIDER_OWNER`, seeds a few sample leads.
- `/dashboard` (guarded): Overview (lead stats, verification banner, recent leads),
  `/dashboard/leads` (inbox with status + private notes), `/dashboard/profile`
  (edit details, submit KYC document reference for a Verified badge).
- Minimal lead distribution: a `POST /api/leads` with a `providerId` goes to that
  provider; a category+city enquiry fans out to up to 3 matching active providers as
  `Lead` rows. The full matching + credit engine is a later module.
- Only `status = ACTIVE` providers appear in public search / profiles.
- Models added: `Provider.ownerId/status/kycStatus`, `KycSubmission`, `Lead`.
- API: `POST|PATCH /api/business`, `POST /api/business/verify`,
  `PATCH /api/dashboard/leads/[id]`.

## What module 4 covers — Reviews & Admin

- Reviews: signed‑in customers write one review per business from the public
  profile (`POST /api/reviews`); providers reply publicly from
  `/dashboard/reviews`; `Review.status` (PUBLISHED / PENDING / HIDDEN) and
  `provider.ratingAvg/ratingCount` are recomputed from PUBLISHED reviews on every
  change (`lib/reviews.ts`).
- Admin console at `/admin` (ADMIN / MODERATOR only): overview queues,
  `/admin/providers` (approve or reject KYC → Verified badge, suspend / reactivate),
  `/admin/reviews` (hide / publish), `/admin/leads` (read‑only enquiry feed).
- API: `POST /api/reviews`, `POST /api/dashboard/reviews/[id]/reply`,
  `PATCH /api/admin/providers/[id]`, `PATCH /api/admin/reviews/[id]`.
- Sign in as the seeded admin (`+91 90000 00001`) to reach `/admin`.

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
