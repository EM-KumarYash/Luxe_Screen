# Luxe Screens

A full-stack booking platform for private luxury theatres. Customers browse theatres, get an AI-style recommendation for their occasion, and complete a 9-step booking with cakes, decor, gifts, coupons and a simulated payment gateway.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL · Prisma 7 · Zod · React Hook Form · Vitest

---

## Features

| Area                      | What it does                                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Landing page**          | Auto-playing hero slideshow, services grid, how-it-works, top-rated theatres (from the database), FAQ, contact form                                                                                 |
| **AI Experience Planner** | Occasion + budget + guests + city → recommended theatre, add-on package within budget, reasons and alternatives. One click opens the booking wizard pre-filled                                      |
| **9-step booking**        | Date & time → theatre → contact → occasion → cakes → decor → gifts → payment → receipt. Live availability, server-side pricing, coupons, a slot hold with a countdown, progress kept across reloads |
| **Gallery**               | Search, filter by city and group size, sort by rating, price or capacity, keyboard-friendly lightbox                                                                                                |
| **Waitlist**              | Lead capture for upcoming cities, with duplicate detection                                                                                                                                          |
| **Responsive**            | Tested at 1440 px, 820 px and 390 px with no horizontal overflow and no console errors                                                                                                              |

## Quick start

> **New to the project?** Follow the step-by-step **[Windows Setup Guide](./SETUP_GUIDE.md)**. It covers installing Node.js and PostgreSQL, creating the database (pgAdmin or SQL Shell), configuring `.env.local` and troubleshooting.

All commands below are for **Windows PowerShell** (the default terminal in VS Code on Windows).

**Prerequisites:** Windows 10/11, Node.js 20.19+, Git, and PostgreSQL 14+ (installed, or via Docker Desktop).

```powershell
git clone <repo-url> luxe-screens
cd luxe-screens
npm install                  # also generates the Prisma client
Copy-Item .env.example .env.local   # then edit DATABASE_URL if needed
```

Start a database (pick one):

```powershell
# Option A: installed PostgreSQL. Create the database, then set your password in DATABASE_URL
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE luxe_screens;"

# Option B: Docker Desktop (matches .env.example, nothing to edit)
docker compose up -d
```

Create the tables, load sample data and run:

```powershell
npm run db:deploy    # applies prisma/migrations
npm run db:seed      # 5 locations, 6 theatres, 24 slots, 12 add-ons, 4 coupons
npm run dev          # http://localhost:3000
```

### Environment variables

| Variable               | Required | Description                                                   |
| ---------------------- | -------- | ------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                                  |
| `NEXT_PUBLIC_BASE_URL` | Yes      | Public URL of the site, used for metadata, sitemap and robots |

Both the app and the Prisma CLI read `.env.local` first, then `.env`. Real env files are git-ignored; only `.env.example` is committed.

### Scripts

| Command                           | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `npm run dev`                     | Start the dev server                         |
| `npm run build` / `npm start`     | Production build and serve                   |
| `npm test`                        | Unit tests (Vitest)                          |
| `npm run typecheck`               | Generate route types and run `tsc`           |
| `npm run lint` / `npm run format` | ESLint / Prettier                            |
| `npm run db:migrate`              | Create and apply migrations (development)    |
| `npm run db:deploy`               | Apply migrations (production)                |
| `npm run db:seed`                 | Load or refresh sample data (safe to re-run) |
| `npm run db:reset`                | Drop, re-migrate and re-seed                 |
| `npm run db:studio`               | Browse the database in Prisma Studio         |

### Try it

- **Coupons:** `LUXE10` (10% off, up to ₹500), `FIRSTSHOW` (₹300 off orders over ₹2,000), `CELEBRATE20` (20% off orders over ₹4,000). `MONSOON25` is expired, to show validation.
- **Payment:** the gateway is simulated. Tick _"Test mode: simulate a declined payment"_ on the payment step to see the failure path. No card details are collected.

---

## Architecture

```
src/
├── app/                 # Routes (pages + API route handlers)
│   ├── api/             # REST endpoints (see below)
│   ├── booking/         # Wizard + /booking/confirmation/[id] receipt
│   ├── ai-planner/  gallery/  waitlist/
│   └── layout.tsx, page.tsx, error.tsx, not-found.tsx, robots.ts, sitemap.ts
├── components/          # booking, gallery, layout, planner, sections, ui, waitlist
├── data/                # Seed catalogue + static marketing copy
├── lib/                 # Framework-free domain logic: pricing, dates, planner, validation
├── server/              # Server-only services that talk to the database
└── types/               # API contract (DTOs, error codes)
prisma/                  # schema.prisma, migrations, seed.ts
```

- **Pages** are Server Components. Catalogue reads use `"use cache"` (tag `catalog`, 1 hour) so the home, gallery, planner and waitlist pages are prerendered. The booking page is partially prerendered: a static shell plus a request-time wizard.
- **Server pages call `src/server/*` directly.** Only client components go through the HTTP API.
- **`src/lib`** holds pure functions shared by the API and the UI. The API is authoritative; the UI only previews prices.

### API

All responses are JSON. Errors always have the shape `{ "error": { "code", "message", "details?" } }`.

| Method & path                                                                                  | Description                                                                 |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET /api/slots?date=YYYY-MM-DD&location=<slug>` (or `&theaterId=`)                            | Theatres with each slot marked `AVAILABLE`, `BOOKED` or `CLOSED`            |
| `POST /api/coupons/validate`                                                                   | `{ code, theaterId, guests, items[] }` → discount and server-side quote     |
| `POST /api/booking`                                                                            | Creates a `PENDING` booking that holds the slot for 10 minutes → `201`      |
| `POST /api/booking/confirm`                                                                    | `{ bookingId, paymentMethod, simulateOutcome? }` → confirms; safe to repeat |
| `GET /api/booking/:id`                                                                         | Booking receipt                                                             |
| `POST /api/planner`                                                                            | `{ occasion, budget, guests, location }` → recommendation + alternatives    |
| `POST /api/waitlist` · `POST /api/contact`                                                     | Lead capture                                                                |
| `GET /api/locations` · `/api/theaters` · `/api/theaters/:slug` · `/api/addons` · `/api/health` | Catalogue and health check                                                  |

Notable status codes: `400` validation, `402` payment declined, `409` slot taken / duplicate waitlist, `410` hold expired, `422` business rule (capacity, date window, coupon), `429` rate limited.

### Data model

`Location` → `Theater` → `Slot` (daily time windows) · `AddOn` → `AddOnOption` · `Booking` → `CartItem` · `Coupon` · `WaitlistEntry` · `ContactMessage`

This extends the suggested schema with `Location`, `AddOnOption`, `Coupon`, `WaitlistEntry` and `ContactMessage`, which the waitlist, coupon and add-on features need.

### Key decisions

- **Money is stored as integer paise**, so there's no floating-point drift. Cart items snapshot their name and price, so later catalogue changes never alter a receipt.
- **Double-booking is impossible at the database level.** A booking holds the slot through a unique `activeSlotKey` (`theaterId:slotId:date`) while it is `PENDING` or `CONFIRMED`. Concurrent attempts get `409`. Lapsed holds are released inside the same transaction.
- **The server prices everything.** Totals are recalculated from catalogue data on every booking; client-sent prices are never trusted.
- **Payment confirmation is idempotent and race-safe.** It uses a conditional update, and coupon redemption is an atomic SQL increment that respects the usage limit.
- **Dates use IST.** Bookings are open from today to 60 days ahead, with a 30-minute lead time before each slot.
- **The "AI" planner is a deterministic, explainable scoring engine** (`src/lib/planner.ts`): capacity fit, occasion mood, budget headroom and rating. Its package builder first secures one item per category, then upgrades within budget. It needs no external API key, so it can't fail at runtime and is unit tested. An LLM could be added later, with this engine as the fallback.

## Testing

```powershell
npm test          # 21 unit tests: pricing, coupons, IST date rules, planner
npm run typecheck
npm run lint
```

The full journeys were also verified end to end in headless Chrome against a production build: booking (including declined payment and retry), planner deep link, gallery and forms. That covered desktop, tablet and mobile, with no console errors.

## Deploying to Vercel

1. Create a PostgreSQL database, for example Neon via the Vercel Marketplace.
2. Import the repo in Vercel and set `DATABASE_URL` and `NEXT_PUBLIC_BASE_URL`.
3. Apply migrations and seed once against the production database (PowerShell):
   ```powershell
   $env:DATABASE_URL = "<prod-url>"
   npm run db:deploy
   npm run db:seed
   Remove-Item Env:DATABASE_URL
   ```
4. Deploy. The build runs `prisma generate && next build`.

## Known limitations

- The payment gateway is simulated, and no confirmation emails or SMS are sent.
- Rate limiting is in memory, per server instance. Use Redis/Upstash for multi-instance deployments.
- There is no admin panel or authentication. Catalogue changes go through `src/data/catalog.ts` + `npm run db:seed`.
