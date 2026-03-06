# FinanceTrack

A personal finance tracker that helps you understand where your money goes — built with Next.js, PostgreSQL, and a clean, focused UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)

---

## What it does

FinanceTrack gives you a calm, clutter-free view of your personal finances:

- **Dashboard** — monthly income vs. expenses chart, spending breakdown by category, recent transactions, and account balances at a glance
- **Transactions** — log income and expenses, filter by type or category, search by description, delete entries
- **Budgets** — set monthly spending limits per category with visual progress bars and over-budget alerts
- **Accounts** — manage multiple accounts (checking, savings, credit cards, investments) and track your net worth

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

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install

```bash
git clone <your-repo-url>
cd nextjs-finance-app
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://<user>@localhost:5432/finance_tracker
AUTH_SECRET=<random-32-byte-base64-string>
AUTH_URL=http://localhost:3000
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Set up the database

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

### 4. Run

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

## Project structure

```
src/
├── app/
│   ├── api/              # REST API routes
│   │   ├── auth/         # NextAuth handler
│   │   ├── register/     # User registration
│   │   ├── transactions/ # CRUD + balance updates
│   │   ├── accounts/     # Account management
│   │   ├── categories/   # Category listing
│   │   ├── budgets/      # Budget tracking
│   │   └── dashboard/    # Aggregated dashboard data
│   ├── auth/             # Sign-in and register pages
│   ├── dashboard/        # Main dashboard
│   ├── transactions/     # Transaction list
│   ├── budgets/          # Budget management
│   └── accounts/         # Account overview
├── components/           # UI components
├── lib/
│   ├── schema.ts         # Drizzle schema (users, accounts, transactions, budgets, categories)
│   ├── db.ts             # Database connection pool
│   ├── api.ts            # Auth, rate-limit, and CSRF helpers
│   ├── validate.ts       # Zod validation schemas
│   ├── rate-limit.ts     # In-memory rate limiter
│   └── format.ts         # Currency and date formatters
├── auth.ts               # Full NextAuth config (Node.js runtime)
├── auth.config.ts        # Edge-safe auth config (used in proxy)
└── proxy.ts              # Route protection (Next.js 16 middleware)
```

---

## Deploying to production

1. Set `DATABASE_URL` with SSL enabled on your hosting provider
2. Set `AUTH_SECRET` and `AUTH_URL` (your public domain)
3. Run `npm run db:push` against the production database
4. Deploy with `npm run build && npm start`

For multi-instance deployments, swap the in-memory rate limiter (`src/lib/rate-limit.ts`) for [Upstash Redis](https://upstash.com).

---

## License

MIT
