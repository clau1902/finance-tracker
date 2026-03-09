import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  PieChart,
  Wallet,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">FinanceTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/register">Get started for free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
          <Zap className="w-3.5 h-3.5" />
          Self-hosted · Free forever · Your data stays yours
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
          Know where every dollar goes —{" "}
          <span className="text-primary">without paying a subscription</span>{" "}
          to find out
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          FinanceTrack is a free, self-hosted finance app. Set budgets, track
          every account, and visualize your spending — with zero monthly fees
          and complete data privacy.
        </p>

        <div className="flex items-center gap-3 mt-8">
          <Button asChild size="lg" className="gap-2 px-6">
            <Link href="/auth/register">
              Start tracking for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-6">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card · No subscription · No data harvesting
        </p>

        {/* ── App preview screenshot ── */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="rounded-2xl border border-border/60 shadow-xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-secondary/40">
              <div className="w-3 h-3 rounded-full bg-rose-400/70" />
              <div className="w-3 h-3 rounded-full bg-amber-400/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              <div className="flex-1 mx-4">
                <div className="bg-background/60 rounded-md h-5 w-48 mx-auto" />
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard-preview.png"
              alt="FinanceTrack dashboard"
              className="w-full block"
            />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-secondary/40 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              The features Mint charged you for — now free
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Everything you actually use to stay on top of your money. Nothing you don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: BarChart3,
                color: "text-primary bg-primary/10",
                title: "Instant Clarity",
                desc: "See 6 months of income vs expenses, trend vs last month, per-category spending with month-over-month changes, and your savings rate — the moment you log in.",
              },
              {
                icon: Target,
                color: "text-amber-600 bg-amber-100",
                title: "Budgets That Work",
                desc: "Set monthly limits per category. The sidebar flags budgets at 80% and over-limit in real time. Navigate past months to review spending history.",
              },
              {
                icon: Wallet,
                color: "text-emerald-600 bg-emerald-100",
                title: "All Accounts, One View",
                desc: "Checking, savings, credit cards, investments — track every account with a clear assets vs. liabilities breakdown and your true net worth.",
              },
              {
                icon: ShieldCheck,
                color: "text-sky-600 bg-sky-100",
                title: "Your Data, Your Server",
                desc: "Self-hosted means no third party ever sees your finances. Bcrypt passwords, auth-protected routes, and strict per-user isolation.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What's included ────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              No learning curve. Just clarity.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Most finance apps bury you in features — then charge $10/month for
              the privilege. FinanceTrack gives you exactly what you need to stay
              on top of your money, free forever.
            </p>
            <ul className="space-y-3">
              {[
                "Log and edit transactions in seconds — search your full history instantly",
                "Filter by date range, category, account, or type — with one-click presets",
                "Budget badges warn you at 80% and flag over-limit in the sidebar",
                "Spot income & expense trends across 6 months at a glance",
                "Export any filtered view to CSV for your own records",
                "Track your true net worth across all accounts with assets vs. liabilities",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats / numbers */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "Self-hosted", label: "Your server, your rules", valueColor: "text-primary" },
              { value: "100%", label: "Data stays on your server", valueColor: "text-emerald-500" },
              { value: "12", label: "Spending categories included", valueColor: "text-amber-500" },
              { value: "$0", label: "Forever free", valueColor: "text-sky-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card p-5 text-center shadow-sm"
              >
                <p className={`text-2xl font-bold tracking-tight leading-tight ${stat.valueColor}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-sidebar">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-sidebar-foreground">
            Stop guessing where your money goes.
          </h2>
          <p className="mt-3 text-sidebar-foreground/60 leading-relaxed">
            Set up in under 5 minutes. Your account and 12 spending categories
            are created automatically when you sign up — no configuration needed.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link href="/auth/register">
                Start tracking for free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-6 border-white/30 text-white bg-transparent hover:bg-white/10"
            >
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">FinanceTrack</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, PostgreSQL &amp; Drizzle ORM
          </p>
        </div>
      </footer>
    </div>
  );
}
