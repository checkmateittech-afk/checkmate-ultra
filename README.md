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

Real payments (Razorpay), notifications and photo uploads are later modules.

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

## What module 5 covers — Wallet & lead-credit engine

- Models: `Wallet` + append-only `WalletTransaction` ledger (signed amounts,
  `balanceAfter`), `Plan`, `Subscription`; `Category.leadPrice`,
  `Provider.tier/rankBoost`, `Lead.creditCost/chargedAt`.
- `lib/wallet.ts` — `applyLedger()` credits/debits inside one transaction and
  refuses to go negative; credit packs (100 / 500 / 2000), welcome bonus (50).
- `lib/leads.ts` rewritten: category+city enquiries fan out to the top‑ranked
  matching providers **that can afford the lead** (rankBoost → verified → rating),
  charging each wallet the category price minus the plan discount, capped at
  3 providers and a daily lead cap. Direct profile enquiries stay free.
- `/dashboard/wallet` — balance, lifetime spent, current plan, one‑tap top‑ups,
  plan switch (STARTER / PRO grant monthly credits + a per‑lead discount +
  ranking boost), full transaction history. Payments are **simulated** here.
- Dashboard overview shows the credit balance + a low‑balance warning; the leads
  inbox shows each lead's credit cost.
- Admin `/admin/providers` shows each provider's tier + balance and can grant
  `+100` credits (`POST /api/admin/providers/[id]/credits`).
- Search "recommended" order now also respects `rankBoost` (paid tiers rank higher).
- API: `POST /api/dashboard/wallet/topup`, `POST /api/dashboard/wallet/plan`,
  `POST /api/admin/providers/[id]/credits`.

## What module 6 covers — Super‑admin console

- `/admin` is now a **standalone app**: consumer site chrome removed (routes split
  into a `(site)` route group with its own layout; `/dashboard` gets its own
  "for business" top bar).
- Left sidebar grouped Overview / Marketplace / System, live KYC + hidden‑review
  badges, mobile drawer, identity + sign‑out.
- **Dashboard** — 8 KPI tiles (providers, verified %, users, leads 24h/7d/all,
  credits in circulation, credits sold, subscription MRR, reviews), a "Needs
  attention" queue grid, inline SVG charts (enquiries 14d, signups & new providers
  8w), provider mix bars, top categories / top providers / highest‑rated / cities,
  and a merged recent‑activity feed.
- **Providers** — search + status/KYC/plan/sort filters, richer table (plan,
  balance, rating, leads), expandable per‑row actions (approve/reject KYC,
  suspend/reactivate, ± credit adjustment).
- **Users** (new) — search + role/status filters, role change, suspend/restore,
  linked business, lead/review counts. `PATCH /api/admin/users/[id]` (role changes
  admin‑only; moderators can't touch staff accounts; can't edit self).
- **Leads** — search + category/city/source filters, per‑enquiry delivery
  breakdown with provider + credit cost.
- **Reviews** — search + status/rating filters, hide/publish.
- **Finance** (new) — credit totals (in circulation / sold / granted / spent /
  refunds), by‑type breakdown, highest & lowest wallet balances, full transaction
  ledger with a type filter.
- **Catalog** (new) — edit per‑category lead price inline
  (`PATCH /api/admin/categories/[id]`); cities with localities and an add‑locality
  form (`POST /api/admin/localities`).
- **Activity log** (new) — merged timeline (enquiries / reviews / KYC / signups /
  credits) with a type filter.
- Seed now backdates provider/user/lead history (~190 historical enquiries with a
  coherent credit ledger) so charts and finance totals are populated.

## What module 7 covers — Courses CMS + team

- **New `EDITOR` role.** Editors reach `/admin` but only see the **Content →
  Courses** section (other admin pages redirect them back). `requireFullStaff()` /
  `requireSuperAdmin()` guards enforce this per page; middleware lets EDITOR into
  `/admin/*`.
- **Team** (`/admin/team`, admin only) — add a team member by name + mobile and a
  role (Editor / Moderator); they sign in with the normal phone‑OTP. Change roles,
  suspend/restore. `POST /api/admin/team`, reuses `PATCH /api/admin/users/[id]`.
- **Courses admin** (`/admin/courses`) — list with status/category filters, a full
  editor form (basics, overview, highlights, curriculum, audience, prerequisites,
  dynamic FAQ, SEO meta, hero colour, details sidebar), draft/publish/archive,
  per‑row actions. Editors can only edit their own courses; admins/mods edit all.
  `POST /api/admin/courses`, `PATCH|DELETE /api/admin/courses/[id]`,
  `POST /api/admin/course-categories`.
- **Public pages** — `/courses` (hero + tracks nav + course cards grouped by
  `CourseCategory`, `ItemList` schema) and `/courses/[slug]` (tinted hero, overview,
  what‑you'll‑learn, numbered curriculum, audience/prerequisites, FAQ accordion,
  sticky enquiry form + quick‑facts). Full SEO: `generateMetadata` (meta title/desc
  with fallbacks, canonical, OpenGraph/Twitter), and JSON‑LD for **Course**
  (+ `CourseInstance`, `Offer`, `provider` Organization), **BreadcrumbList** and
  **FAQPage**. Draft courses are previewable by staff only, `noindex`.
- **`sitemap.ts` + `robots.ts`** — sitemap covers home, `/courses`, every published
  course and the category/city directory pages; robots disallows `/admin`,
  `/dashboard`, `/account`, `/api/`. Set `NEXT_PUBLIC_SITE_URL` for production.
- Models added: `Course`, `CourseCategory` (+ `User.courses`). Seed ships 6 tracks
  and 8 published courses authored by the admin, plus an `EDITOR` user
  (`+91 97777 00001`).

## What module 8 covers — Platform branding & settings

- **`SiteSettings`** singleton (id `"singleton"`) holds logo/favicon URLs, site
  name, tagline, support email/phone, a brand hex colour, and an announcement
  banner. `src/lib/settings.ts` (`getSiteSettings()`, per-request cached) reads
  it everywhere; `upsertSiteSettings()` writes it.
- **`/admin/settings`** (admin only — `requireSuperAdmin()`): logo + favicon
  upload with live preview/replace/remove, platform name + tagline, support
  contact, a brand-colour picker (presets + hex), and an announcement banner
  with live preview.
- **Uploads** go through `POST/DELETE /api/admin/settings/logo?type=logo|favicon`
  to `src/lib/upload.ts`, which validates type (PNG/JPG/WebP/SVG/ICO) and size
  (≤2MB) and writes to `public/uploads/branding/` (gitignored — local disk only;
  swap for R2/S3 before deploying anywhere serverless/ephemeral).
- **Text/colour fields** save via `POST /api/admin/settings` (admin only).
  `src/lib/color.ts` derives the brand‑50/100/500/600/700 ramp from one hex and
  the root layout applies it as inline CSS variables on `<html>`, so a colour
  change re‑themes buttons, links and accents everywhere without touching
  Tailwind config.
- Branding is now **live everywhere**: site header/footer, the provider
  dashboard top bar, the admin sidebar, `<title>`/meta description, the
  favicon, and the `Organization` entry in course `Course` JSON‑LD. The
  announcement banner renders at the top of every public page when active.

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
