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
          Open source · Free forever · Your data stays yours
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

        {/* ── App preview card ── */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden">
            {/* Fake window bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-secondary/40">
              <div className="w-3 h-3 rounded-full bg-rose-400/70" />
              <div className="w-3 h-3 rounded-full bg-amber-400/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              <div className="flex-1 mx-4">
                <div className="bg-background/60 rounded-md h-5 w-48 mx-auto" />
              </div>
            </div>

            {/* Fake app layout */}
            <div className="flex h-72">
              {/* Sidebar mock */}
              <div className="w-44 border-r border-border/50 bg-sidebar p-3 space-y-1 flex-shrink-0">
                <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                  <div className="w-5 h-5 rounded bg-primary/80" />
                  <div className="h-2.5 w-20 bg-sidebar-foreground/20 rounded" />
                </div>
                {[
                  { active: true, w: "w-16" },
                  { active: false, w: "w-20" },
                  { active: false, w: "w-14" },
                  { active: false, w: "w-18" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                      item.active ? "bg-sidebar-primary" : ""
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded ${item.active ? "bg-sidebar-primary-foreground/60" : "bg-sidebar-foreground/20"}`} />
                    <div className={`h-2 ${item.w} rounded ${item.active ? "bg-sidebar-primary-foreground/40" : "bg-sidebar-foreground/15"}`} />
                  </div>
                ))}
              </div>

              {/* Main content mock */}
              <div className="flex-1 p-4 bg-background space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: "bg-primary/15", bar: "bg-primary/40", label: "w-12", val: "w-16" },
                    { color: "bg-emerald-100", bar: "bg-emerald-400/50", label: "w-14", val: "w-12" },
                    { color: "bg-rose-100", bar: "bg-rose-400/50", label: "w-14", val: "w-14" },
                    { color: "bg-secondary", bar: "bg-primary/30", label: "w-10", val: "w-12" },
                  ].map((card, i) => (
                    <div key={i} className={`${card.color} rounded-xl p-2.5 space-y-1.5`}>
                      <div className={`h-1.5 ${card.label} ${card.bar} rounded`} />
                      <div className={`h-3 ${card.val} bg-foreground/15 rounded`} />
                    </div>
                  ))}
                </div>

                {/* Chart + list row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Area chart mock */}
                  <div className="col-span-2 bg-card border border-border/40 rounded-xl p-3">
                    <div className="h-2 w-24 bg-foreground/10 rounded mb-3" />
                    <div className="flex items-end gap-1 h-16">
                      {[30, 55, 40, 70, 50, 85, 60, 90, 65, 80, 45, 70].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                          <div
                            className="w-full bg-primary/25 rounded-t"
                            style={{ height: `${h * 0.5}%` }}
                          />
                          <div
                            className="w-full bg-rose-300/40 rounded-t"
                            style={{ height: `${(100 - h) * 0.3}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pie mock */}
                  <div className="bg-card border border-border/40 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                    <div className="w-14 h-14 rounded-full border-8 border-primary/40 border-t-primary border-r-emerald-400/60" />
                    <div className="space-y-1 w-full">
                      {["w-10", "w-14", "w-8"].map((w, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${["bg-primary/60","bg-emerald-400/60","bg-amber-400/60"][i]}`} />
                          <div className={`h-1.5 ${w} bg-foreground/10 rounded`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                desc: "See 6 months of income vs expenses, trend vs last month, your spending breakdown by category, and recent transactions — the moment you log in.",
              },
              {
                icon: Target,
                color: "text-amber-600 bg-amber-100",
                title: "Budgets That Work",
                desc: "Set monthly limits per category. Navigate past months to review history. Get warned before you overspend — not after it&apos;s too late.",
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
                "Log and edit transactions in seconds — no manual imports",
                "Instant search across your entire transaction history",
                "Get warned before you blow your monthly budget",
                "Spot income & expense trends across 6 months",
                "See at a glance where your money actually goes",
                "Track your true net worth across all accounts",
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
              { value: "Self-hosted", label: "Your server, your rules", color: "border-primary/30 bg-primary/5" },
              { value: "Open source", label: "Every line auditable", color: "border-emerald-300/40 bg-emerald-50" },
              { value: "12", label: "Spending categories included", color: "border-amber-300/40 bg-amber-50" },
              { value: "$0", label: "Forever free", color: "border-sky-300/40 bg-sky-50" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-5 text-center ${stat.color}`}
              >
                <p className="text-2xl font-bold tracking-tight leading-tight">{stat.value}</p>
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
              className="px-6 border-sidebar-border text-sidebar bg-sidebar-foreground/90 hover:bg-sidebar-foreground"
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
