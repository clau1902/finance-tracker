# FinanceTrack

A self-hosted personal finance tracker — built with Next.js, PostgreSQL, and Docker.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker)

---

## What it does

FinanceTrack gives you a calm, clutter-free view of your personal finances:

- **Dashboard** — guided onboarding checklist for new users (set balance → log transaction → create budget) that auto-dismisses on completion; monthly income vs. expenses chart (6 months); trend % vs last month per card; savings rate; per-category spending with month-over-month change indicators; recent transactions; account balances; skeleton loading states
- **Transactions** — log, edit, and delete income and expenses; server-side search across full history with debounce; filter by type, category, account, and date range; quick date presets (this month, last month, last 3 months, this year); inline category reassignment with toast feedback; notes visible in list; CSV export; pagination with load more; date-grouped list; keyboard shortcut `N` to add a transaction; **multi-currency support** — each transaction is displayed in its account's currency; summary bar shows per-currency totals when multiple currencies are present; breakdown by account with TrueLayer badge on connected accounts
- **Budgets** — set monthly spending limits per category; navigate between months; overall status summary (on track / warning / over); days remaining in month; skeleton loading; visual progress bars with colour-coded alerts; sidebar badge shows live alert count (amber at 80%, red when over limit)
- **Accounts** — add accounts manually or connect a bank via TrueLayer (Open Banking); edit, delete (with confirmation); **retire** accounts to hide them from the active list and net worth without losing transaction history (restorable at any time); sync balance and transactions from connected banks; net worth with assets vs. liabilities breakdown (active accounts only); "View transactions" link per account
- **Categories** — full CRUD for income and expense categories; 12-colour visual picker; deleting a category unlinks transactions gracefully
- **Dark mode** — system-aware, toggled from the sidebar
- **Mobile** — responsive layout with hamburger menu and slide-in sidebar drawer on small screens

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| UI | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Auth | NextAuth v5 (credentials + JWT) |
| Toasts | Sonner |
| Theme | next-themes |
| Testing | Vitest + Testing Library |
| Deployment | Docker + Docker Compose |

---

## Security

- Password hashing with bcrypt (cost factor 12); minimum 12 characters, must include a letter and a number
- JWT session strategy — no session table required
- All API routes require authentication
- Every query is scoped to the authenticated user — no data leakage between accounts
- Ownership verification on all related resources (accounts, categories) during mutations
- Input validation with Zod on every endpoint
- Rate limiting on all API routes, keyed by `userId:IP` on mutation endpoints
- CSRF origin validation on all mutating requests (POST, PATCH, DELETE)
- CSP header: `unsafe-eval` is excluded in production (only present during development for Next.js HMR)
- HTTP security headers (X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, etc.)
- PostgreSQL connection pool with SSL in production; SSL disabled automatically for internal Docker networking

---

## Open Banking (TrueLayer)

FinanceTrack integrates with [TrueLayer](https://truelayer.com) to connect real bank accounts and automatically sync balances and transactions.

### Setup

1. Create an application at [console.truelayer.com](https://console.truelayer.com)
2. Add your redirect URI: `https://<your-domain>/api/truelayer/callback` (and `http://localhost:3000/api/truelayer/callback` for local dev)
3. Add the credentials to your `.env.local` (or `.env.docker`):

```env
TRUELAYER_CLIENT_ID=your-client-id
TRUELAYER_CLIENT_SECRET=your-client-secret
TRUELAYER_SANDBOX=false   # set to true to use TrueLayer sandbox with mock banks
```

When `TRUELAYER_SANDBOX=true` a mock bank provider is shown — useful for development and testing without real credentials.

### How it works

- Users click **Connect Bank** on the Accounts page and are redirected to TrueLayer's auth flow
- On completion, the account is imported with its balance and last 90 days of transactions
- Connected accounts show a **Sync** button to pull the latest balance and new transactions on demand
- Transactions from TrueLayer carry a TrueLayer badge in the Transactions breakdown view

---

## Getting started

### Option A — Docker (recommended)

The fastest way to run FinanceTrack. No need to install Node.js or PostgreSQL separately.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone <your-repo-url>
cd nextjs-finance-app

# Copy the env template and fill in your values
cp .env.docker.example .env.docker
```

Edit `.env.docker` — at minimum set `POSTGRES_PASSWORD` and `AUTH_SECRET`:

```bash
# Generate a secure password
openssl rand -base64 24

# Generate an auth secret
openssl rand -base64 32
```

Then start everything:

```bash
docker compose --env-file .env.docker up -d
```

This builds the app, starts PostgreSQL, runs database migrations, and starts the server. Open [http://localhost:3000](http://localhost:3000).

To stop:
```bash
docker compose --env-file .env.docker down
```

> Data is persisted in a Docker volume (`postgres_data`). Use `down -v` to wipe it completely.

---

### Option B — Local development

**Prerequisites:** Node.js 18+, PostgreSQL 14+

#### 1. Clone and install

```bash
git clone <your-repo-url>
cd nextjs-finance-app
npm install
```

#### 2. Configure environment

Create `.env.local` in the project root:

```env
POSTGRES_URL=postgresql://<user>:<password>@localhost:5432/finance_tracker
AUTH_SECRET=<random-32-byte-base64-string>
AUTH_URL=http://localhost:3000

# TrueLayer Open Banking (optional)
TRUELAYER_CLIENT_ID=your-client-id
TRUELAYER_CLIENT_SECRET=your-client-secret
TRUELAYER_SANDBOX=true
```

Generate an auth secret:

```bash
openssl rand -base64 32
```

> If your database password contains special characters (`/`, `+`, `=`), percent-encode them in the URL (e.g. `/` → `%2F`).

#### 3. Set up the database

```bash
# Create the database
psql -c "CREATE DATABASE finance_tracker;"

# Push the schema
npm run db:push

# Seed with a demo user and sample data (optional)
npm run db:seed
```

Demo credentials after seeding:
- **Email:** `demo@example.com`
- **Password:** `demo1234`

> The demo account is created directly via the seed script and bypasses the registration password policy.

#### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database commands

| Command | Description |
|---|---|
| `npm run db:push` | Apply schema changes to the database |
| `npm run db:generate` | Generate migration SQL files |
| `npm run db:seed` | Seed demo user, categories, transactions, and budgets |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |

---

## Running tests

```bash
npm test
```

---

## Project structure

```
src/
├── app/
│   ├── api/              # REST API routes
│   │   ├── auth/         # NextAuth handler
│   │   ├── register/     # User registration
│   │   ├── transactions/ # CRUD + balance updates + server-side search
│   │   ├── accounts/     # Account management (list, create, edit, delete)
│   │   ├── categories/   # Category CRUD
│   │   ├── budgets/      # Budget tracking (list, create, delete by ID)
│   │   └── dashboard/    # Aggregated dashboard data (trends, savings rate)
│   ├── auth/             # Sign-in and register pages
│   ├── dashboard/        # Main dashboard
│   ├── transactions/     # Transaction list
│   ├── budgets/          # Budget management
│   ├── accounts/         # Account overview
│   └── categories/       # Category management
├── components/           # UI components
├── lib/
│   ├── schema.ts         # Drizzle schema (users, accounts, transactions, budgets, categories)
│   ├── truelayer.ts      # TrueLayer API client (auth, accounts, transactions, balances)
│   ├── db.ts             # Database connection pool
│   ├── api.ts            # Auth, rate-limit, and CSRF helpers
│   ├── validate.ts       # Zod validation schemas
│   ├── rate-limit.ts     # In-memory rate limiter (swap for Upstash Redis in production)
│   └── format.ts         # Currency and date formatters
├── auth.ts               # Full NextAuth config (Node.js runtime)
├── auth.config.ts        # Edge-safe auth config (used in proxy)
└── proxy.ts              # Route protection (Next.js 16 middleware)
```

---

## Deploying to production

### With Docker (recommended)

1. Copy `.env.docker.example` to `.env.docker` and set production values:
   - `POSTGRES_PASSWORD` — strong random password
   - `AUTH_SECRET` — strong random secret (`openssl rand -base64 32`)
   - `AUTH_URL` — your public domain (e.g. `https://finance.yourdomain.com`)
   - `TRUELAYER_CLIENT_ID` / `TRUELAYER_CLIENT_SECRET` / `TRUELAYER_SANDBOX=false` — if using Open Banking

2. Run on your server:
   ```bash
   docker compose --env-file .env.docker up -d
   ```

3. Put a reverse proxy (nginx, Caddy, Traefik) in front of port 3000 to handle HTTPS.

### Without Docker

1. Set `POSTGRES_URL` with SSL enabled
2. Set `AUTH_SECRET` and `AUTH_URL` (your public domain)
3. Set TrueLayer env vars if using Open Banking
4. Build and start: `npm run build && npm start`

> Database migrations run automatically on startup via `src/instrumentation.ts` — no manual `db:push` needed in production.

For multi-instance deployments, swap the in-memory rate limiter (`src/lib/rate-limit.ts`) for [Upstash Redis](https://upstash.com).

---

## License

MIT
