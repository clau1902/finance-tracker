# FinanceTrack

A personal finance tracker that helps you understand where your money goes — built with Next.js, PostgreSQL, and open banking via TrueLayer.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)

---

## What it does

FinanceTrack gives you a calm, clutter-free view of your personal finances:

- **Dashboard** — monthly income vs. expenses chart with trend % vs last month, spending breakdown by category, recent transactions, account balances, and skeleton loading states
- **Transactions** — log, edit, and delete income and expenses; filter by type, category, account, and date range; quick date presets (this month, last month, etc.); search with debounce; date-grouped list; inline category reassignment; CSV export; bank-imported transactions have financial fields locked to preserve accuracy
- **Budgets** — set monthly spending limits per category; navigate between months; overall status summary (on track / warning / over); days remaining in month; skeleton loading; visual progress bars with colour-coded alerts
- **Accounts** — add accounts manually or connect via open banking; edit, delete (with confirmation), and sync connected accounts; net worth with assets vs. liabilities breakdown; "View transactions" link per account
- **Categories** — full CRUD for income and expense categories; 12-colour visual picker; deleting a category unlinks transactions gracefully
- **Open banking** — connect real bank accounts via TrueLayer; accounts and 90 days of transactions are imported automatically; re-sync button per connected account; bank-imported transactions are protected from accidental edits
- **Dark mode** — system-aware, toggled from the sidebar
- **Mobile** — responsive sidebar with hamburger menu on small screens; budget alerts badge in sidebar nav

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
| Open banking | TrueLayer Data API |
| Toasts | Sonner |
| Theme | next-themes |
| Testing | Vitest + Testing Library |

---

## Security

- Password hashing with bcrypt (cost factor 12)
- JWT session strategy — no session table required
- All API routes require authentication
- Every query is scoped to the authenticated user — no data leakage between accounts
- Input validation with Zod on every endpoint
- Rate limiting on all API routes
- CSRF origin validation on mutating requests
- HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
- PostgreSQL connection pool with SSL in production
- Bank-imported transactions lock financial fields (amount, date, description) to prevent data corruption

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A [TrueLayer](https://truelayer.com) account (free sandbox available)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd nextjs-finance-app
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/finance_tracker
AUTH_SECRET=<random-32-byte-base64-string>
AUTH_URL=http://localhost:3000

# TrueLayer (sandbox)
TRUELAYER_CLIENT_ID=sandbox-<your-client-id>
TRUELAYER_CLIENT_SECRET=<your-client-secret>
TRUELAYER_SANDBOX=true
```

Generate an auth secret with:

```bash
openssl rand -base64 32
```

> **Note:** If your database password contains special characters (`/`, `+`, `=`), percent-encode them in the URL (e.g. `/` → `%2F`).

### 3. Set up TrueLayer

1. Create a free account at [console.truelayer.com](https://console.truelayer.com)
2. Create an app and copy the sandbox `client_id` and `client_secret`
3. Add `http://localhost:3000/api/truelayer/callback` as an allowed redirect URI
4. Use credentials `john`/`doe` in the sandbox bank picker

For production, set `TRUELAYER_SANDBOX=false` and use your live credentials. Production access requires contacting TrueLayer at `sales@truelayer.com`.

### 4. Set up the database

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

### 5. Run

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

26 tests covering the TrueLayer client library and the onboarding checklist component.

---

## Project structure

```
src/
├── app/
│   ├── api/              # REST API routes
│   │   ├── auth/         # NextAuth handler
│   │   ├── register/     # User registration
│   │   ├── transactions/ # CRUD + balance updates
│   │   ├── accounts/     # Account management (list, create, edit, delete)
│   │   ├── categories/   # Category CRUD
│   │   ├── budgets/      # Budget tracking (list, create, delete by ID)
│   │   ├── dashboard/    # Aggregated dashboard data (incl. last-month trend)
│   │   └── truelayer/    # Open banking (connect, callback, sync)
│   ├── auth/             # Sign-in and register pages
│   ├── dashboard/        # Main dashboard
│   ├── transactions/     # Transaction list
│   ├── budgets/          # Budget management
│   ├── accounts/         # Account overview
│   └── categories/       # Category management
├── components/           # UI components
├── lib/
│   ├── schema.ts         # Drizzle schema (users, accounts, transactions, budgets, categories)
│   ├── db.ts             # Database connection pool
│   ├── api.ts            # Auth, rate-limit, and CSRF helpers
│   ├── validate.ts       # Zod validation schemas
│   ├── rate-limit.ts     # In-memory rate limiter
│   ├── truelayer.ts      # TrueLayer API client
│   └── format.ts         # Currency and date formatters
├── auth.ts               # Full NextAuth config (Node.js runtime)
├── auth.config.ts        # Edge-safe auth config (used in proxy)
└── proxy.ts              # Route protection (Next.js 16 middleware)
```

---

## Deploying to production

1. Set `DATABASE_URL` with a strong password and SSL enabled
2. Set `AUTH_SECRET` and `AUTH_URL` (your public domain)
3. Set `TRUELAYER_CLIENT_ID`, `TRUELAYER_CLIENT_SECRET`, and `TRUELAYER_SANDBOX=false`
4. Register your production redirect URI in the TrueLayer console
5. Run `npm run db:push` against the production database
6. Deploy with `npm run build && npm start`

For multi-instance deployments, swap the in-memory rate limiter (`src/lib/rate-limit.ts`) for [Upstash Redis](https://upstash.com).

---

## License

MIT
