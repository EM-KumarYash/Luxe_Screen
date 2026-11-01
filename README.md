# Luxe Screens

A full-stack booking platform for private luxury theatres. Customers browse theatres, get an AI-style recommendation for their occasion, and complete a 9-step booking with cakes, decor, gifts, coupons and a simulated payment gateway.

**Stack:** React 19 · Vite · React Router 7 · Tailwind CSS v4 · Node.js · Express 5 · PostgreSQL · Prisma 7 · Zod · React Hook Form · Vitest. Written in plain **JavaScript**.

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

## Project structure

```
Luxe_Screen/                 npm workspaces: one `npm install` at the root
├── client/                  React 19 single-page app (Vite)
│   ├── src/pages/           One file per route: data `loader` + `Component`
│   ├── src/components/      booking, gallery, layout, planner, sections, ui, waitlist
│   ├── src/lib/             API client, helpers
│   └── src/data/            Static marketing copy
├── server/                  REST API (Express 5)
│   ├── src/routes.js        All /api endpoints
│   ├── src/services/        Business logic + database access (Prisma)
│   ├── src/lib/             Errors, rate limiting, database client
│   ├── src/data/            Seed catalogue
│   └── prisma/              schema.prisma, migrations, seed.js
├── shared/                  Pure JS used by both: pricing, coupons, IST dates, planner, Zod schemas
├── docker-compose.yml       Optional local PostgreSQL
├── vercel.json              Frontend deployment (Vercel)
└── render.yaml              API deployment (Render)
```

## Quick start

> **New to the project?** Follow the step-by-step **[Windows Setup Guide](./SETUP_GUIDE.md)**. It covers installing Node.js and PostgreSQL, creating the database (pgAdmin or SQL Shell), configuring `server\.env` and troubleshooting.

All commands below are for **Windows PowerShell** (the default terminal in VS Code on Windows).

**Prerequisites:** Windows 10/11, Node.js 20.19+, Git, and PostgreSQL 14+ (installed, or via Docker Desktop).

```powershell
git clone https://github.com/EM-KumarYash/Luxe_Screen.git
cd Luxe_Screen
npm install                                      # installs client, server and shared
Copy-Item server\.env.example server\.env        # then edit DATABASE_URL if needed
```

Start a database (pick one):

```powershell
# Option A: installed PostgreSQL. Create the database, then set your password in DATABASE_URL
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE luxe_screens;"

# Option B: Docker Desktop (matches server\.env.example, nothing to edit)
docker compose up -d
```

Create the tables, load sample data and run:

```powershell
npm run db:deploy    # applies server/prisma/migrations
npm run db:seed      # 5 locations, 6 theatres, 24 slots, 12 add-ons, 4 coupons
npm run dev          # API on http://localhost:4000, website on http://localhost:5173
```

### Environment variables

**`server\.env`** (required)

| Variable        | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`  | PostgreSQL connection string                                                       |
| `PORT`          | API port (default `4000`)                                                          |
| `CLIENT_ORIGIN` | Frontend URL(s) allowed by CORS, comma-separated (default `http://localhost:5173`) |

**`client\.env`** (production only)

| Variable       | Description                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL` | Public URL of the deployed API, e.g. `https://luxe-screens-api.onrender.com`. Leave empty locally: Vite forwards `/api` to port 4000 |

Real env files are git-ignored; only the `.env.example` files are committed.

### Scripts (run from the root)

| Command                                     | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `npm run dev`                               | Start API and website together                     |
| `npm run dev:server` / `npm run dev:client` | Start one of them                                  |
| `npm run build` / `npm run preview`         | Production build of the website / serve it locally |
| `npm start`                                 | Start the API in production mode                   |
| `npm test`                                  | Unit + API tests (Vitest)                          |
| `npm run lint` / `npm run format`           | ESLint / Prettier                                  |
| `npm run db:migrate`                        | Create and apply migrations (development)          |
| `npm run db:deploy`                         | Apply migrations (setup and production)            |
| `npm run db:seed`                           | Load or refresh sample data (safe to re-run)       |
| `npm run db:reset`                          | Drop, re-migrate and re-seed                       |
| `npm run db:studio`                         | Browse the database in Prisma Studio               |

### Try it

- **Coupons:** `LUXE10` (10% off, up to ₹500), `FIRSTSHOW` (₹300 off orders over ₹2,000), `CELEBRATE20` (20% off orders over ₹4,000). `MONSOON25` is expired, to show validation.
- **Payment:** the gateway is simulated. Tick _"Test mode: simulate a declined payment"_ on the payment step to see the failure path. No card details are collected.

---

## Architecture

```
Browser ── React SPA (client) ──fetch /api/...──► Express API (server) ──Prisma──► PostgreSQL
                │                                        │
                └──── both import shared/ (pricing, validation, dates) ────┘
```

- **Client:** each route in `client/src/router.jsx` lazy-loads a page module that exports a **loader** (fetches its data from the API before rendering) and a **Component**. Errors and unknown URLs render an error/404 page inside the normal layout. Per-page `<title>` and `<meta>` use React 19's built-in metadata hoisting.
- **Server:** thin route handlers in `routes.js` validate input with Zod and call services in `src/services/`. Express 5 forwards thrown errors to one `errorHandler`, so every error has the same JSON shape.
- **Shared:** pure functions with no I/O, so the UI previews prices with exactly the rules the server enforces.

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

### Key decisions

- **Money is stored as integer paise**, so there's no floating-point drift. Cart items snapshot their name and price, so later catalogue changes never alter a receipt.
- **Double-booking is impossible at the database level.** A booking holds the slot through a unique `activeSlotKey` (`theaterId:slotId:date`) while it is `PENDING` or `CONFIRMED`. Concurrent attempts get `409`. Lapsed holds are released inside the same transaction.
- **The server prices everything.** Totals are recalculated from catalogue data on every booking; client-sent prices are never trusted.
- **Payment confirmation is idempotent and race-safe.** It uses a conditional update, and coupon redemption is an atomic SQL increment that respects the usage limit.
- **Dates use IST.** Bookings are open from today to 60 days ahead, with a 30-minute lead time before each slot.
- **The "AI" planner is a deterministic, explainable scoring engine** (`shared/src/planner.js`): capacity fit, occasion mood, budget headroom and rating. Its package builder first secures one item per category, then upgrades within budget. It needs no external API key, so it can't fail at runtime and is unit tested. An LLM could be added later, with this engine as the fallback.
- **Prisma uses the `prisma-client-js` generator**, which outputs plain JavaScript, with the `pg` driver adapter.

## Testing

```powershell
npm test     # 28 tests: pricing, coupons, IST date rules, planner (shared) + API validation, CORS, rate limiting (server)
npm run lint
```

The full journeys were also verified end to end in headless Chrome against the production build: booking (including declined payment and retry), planner deep link, gallery and forms. That covered desktop, tablet and mobile, with no console errors.

## Deployment

The frontend and the API deploy separately; the database is a managed PostgreSQL such as [Neon](https://neon.tech).

1. **Database:** create a PostgreSQL database and copy its connection URL. Apply migrations and seed once (PowerShell):
   ```powershell
   $env:DATABASE_URL = "<prod-url>"
   npm run db:deploy
   npm run db:seed
   Remove-Item Env:DATABASE_URL
   ```
2. **API on Render:** New → Blueprint → select this repo (uses `render.yaml`). Set `DATABASE_URL` and `CLIENT_ORIGIN` (your Vercel URL). Health check: `/api/health`.
3. **Website on Vercel:** import the repo with the **root directory left as the repository root** (`vercel.json` builds `client/dist`). Set `VITE_API_URL` to the Render URL, then deploy.
4. Update `CLIENT_ORIGIN` on Render if the Vercel URL changes.

Render's free plan sleeps when idle, so the first request after a while can take ~30 seconds.

## Known limitations

- The payment gateway is simulated, and no confirmation emails or SMS are sent.
- Rate limiting is in memory, per server instance. Use Redis for multi-instance deployments.
- There is no admin panel or authentication. Catalogue changes go through `server/src/data/catalog.js` + `npm run db:seed`.
- The website is a client-rendered SPA, so search engines see less content than with server rendering.
