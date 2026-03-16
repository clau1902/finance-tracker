"use client";

import { useEffect, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CreditCard,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TransactionRow } from "@/components/transaction-row";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { CurrencySelector } from "@/components/currency-selector";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatCurrency } from "@/lib/format";

interface DashboardData {
  primaryCurrency: string;
  displayCurrency: string;
  balanceByCurrency: Record<string, number>;
  monthIncomeByCurrency: Record<string, number>;
  monthExpenseByCurrency: Record<string, number>;
  lastMonthIncomeByCurrency: Record<string, number>;
  lastMonthExpenseByCurrency: Record<string, number>;
  monthlySavingsByCurrency: Record<string, number>;
  convertedTotalBalance: number | null;
  convertedMonthIncome: number | null;
  convertedMonthExpense: number | null;
  convertedMonthlySavings: number | null;
  accounts: Account[];
  recentTransactions: Transaction[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  spendingByCategory: { name: string; color: string; total: number; lastMonthTotal: number }[];
  hasBudgets: boolean;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
  currency: string;
  color: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: string;
  type: "income" | "expense";
  date: string;
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string; currency: string } | null;
}

const accountIcons: Record<string, React.ElementType> = {
  checking: Wallet,
  savings: Landmark,
  credit: CreditCard,
  investment: TrendingUp,
};

function trendPct(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-28" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 border-border/60">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();

  const fetchData = useCallback(async () => {
    try {
      const url = displayCurrency
        ? `/api/dashboard?displayCurrency=${displayCurrency}`
        : "/api/dashboard";
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [displayCurrency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 30_000);

  // Handle Yapily callback query params
  useEffect(() => {
    if (searchParams.get("bank_connected") === "1") {
      toast.success("Bank connected! Your accounts have been imported.");
      router.replace("/dashboard");
      fetchData();
    } else if (searchParams.get("bank_error") === "1") {
      toast.error("Bank connection failed or was cancelled.");
      router.replace("/dashboard");
    }
  }, [searchParams, router, fetchData]);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  // c = the currency used for converted totals and chart labels
  const c = data.displayCurrency;
  const isDisplayCurrencySet = !!displayCurrency;

  /**
   * Renders a card value section.
   * - Display currency set + converted value available → show converted value large,
   *   native per-currency amounts small below as reference.
   * - Otherwise → show native amounts stacked (primary large, others small).
   */
  function CardValue({
    map,
    converted,
    colorFn,
  }: {
    map: Record<string, number>;
    converted: number | null;
    colorFn?: (v: number) => string;
  }) {
    const entries = Object.entries(map).filter(([, v]) => v !== 0);

    if (isDisplayCurrencySet && converted !== null) {
      const color = colorFn ? colorFn(converted) : "text-foreground";
      return (
        <div>
          <p className={`text-base sm:text-2xl font-semibold tabular-nums ${color}`}>
            ≈ {formatCurrency(converted, c)}
          </p>
          {entries.length > 0 && (
            <div className="flex flex-wrap gap-x-2 mt-1">
              {entries.map(([cur, val]) => (
                <span key={cur} className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(val, cur)}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (entries.length === 0)
      return <span className="text-base sm:text-2xl font-semibold text-foreground">{formatCurrency(0, c)}</span>;

    return (
      <div className="space-y-0.5">
        {entries.map(([cur, val], i) => (
          <p
            key={cur}
            className={`font-semibold tabular-nums ${
              i === 0 ? "text-base sm:text-2xl" : "text-xs text-muted-foreground"
            } ${colorFn ? colorFn(val) : "text-foreground"}`}
          >
            {formatCurrency(val, cur)}
          </p>
        ))}
      </div>
    );
  }

  // Trend % — use converted totals when a display currency is active, otherwise primary currency
  const thisIncome = data.convertedMonthIncome ?? data.monthIncomeByCurrency[c] ?? 0;
  const lastIncome = data.lastMonthIncomeByCurrency[c] ?? 0;
  const thisExpense = data.convertedMonthExpense ?? data.monthExpenseByCurrency[c] ?? 0;
  const lastExpense = data.lastMonthExpenseByCurrency[c] ?? 0;
  const incomePct = trendPct(thisIncome, lastIncome);
  const expensePct = trendPct(thisExpense, lastExpense);
  const primarySavings = data.convertedMonthlySavings ?? data.monthlySavingsByCurrency[c] ?? 0;
  const primaryIncome = thisIncome;
  const savingsRate = primaryIncome > 0 ? Math.round((primarySavings / primaryIncome) * 100) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CurrencySelector value={displayCurrency} onChange={setDisplayCurrency} />
          <AddTransactionDialog
            onSuccess={fetchData}
            open={txDialogOpen}
            onOpenChange={setTxDialogOpen}
          />
        </div>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist
        hasAccounts={data.accounts.some((a) => parseFloat(a.balance) !== 0)}
        hasTransactions={data.recentTransactions.length > 0}
        hasBudgets={data.hasBudgets}
        onAddTransaction={() => setTxDialogOpen(true)}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Balance */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Balance</p>
                <div className="mt-1">
                  <CardValue map={data.balanceByCurrency} converted={data.convertedTotalBalance} />
                </div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Income</p>
                <div className="mt-1">
                  <CardValue map={data.monthIncomeByCurrency} converted={data.convertedMonthIncome} />
                </div>
                {incomePct !== null && (
                  <p className={`text-xs mt-1 font-medium ${incomePct >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {incomePct >= 0 ? "+" : ""}{incomePct.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Expenses</p>
                <div className="mt-1">
                  <CardValue map={data.monthExpenseByCurrency} converted={data.convertedMonthExpense} />
                </div>
                {expensePct !== null && (
                  <p className={`text-xs mt-1 font-medium ${expensePct <= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {expensePct >= 0 ? "+" : ""}{expensePct.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Savings */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Savings</p>
                <div className="mt-1">
                  <CardValue
                    map={data.monthlySavingsByCurrency}
                    converted={data.convertedMonthlySavings}
                    colorFn={(v) => v >= 0 ? "text-foreground" : "text-rose-500"}
                  />
                </div>
                {savingsRate !== null && (
                  <p className={`text-xs mt-1 font-medium ${savingsRate >= 20 ? "text-emerald-600" : savingsRate >= 0 ? "text-amber-600" : "text-rose-500"}`}>
                    {savingsRate}% savings rate
                  </p>
                )}
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${primarySavings >= 0 ? "bg-teal-100" : "bg-rose-100"} flex items-center justify-center flex-shrink-0`}>
                <PiggyBank className={`w-4 h-4 sm:w-5 sm:h-5 ${primarySavings >= 0 ? "text-teal-600" : "text-rose-500"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <Card className="xl:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => formatCurrency(Number(v) / 1000, c).replace(/\.00$/, "") + "k"} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value), c), ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="income" stroke="#0d9488" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length > 0 ? (
              <div className="space-y-2.5">
                {data.spendingByCategory.slice(0, 6).map((cat) => {
                  const pct = cat.lastMonthTotal > 0
                    ? ((cat.total - cat.lastMonthTotal) / cat.lastMonthTotal) * 100
                    : null;
                  const isUp = pct !== null && pct > 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm flex-1 truncate">{cat.name}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(cat.total, c)}
                      </span>
                      {pct !== null && (
                        <span
                          className={`text-xs font-medium w-14 text-right tabular-nums ${
                            isUp ? "text-rose-500" : "text-emerald-600"
                          }`}
                        >
                          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  );
                })}
                {data.spendingByCategory.length > 6 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{data.spendingByCategory.length - 6} more categories
                  </p>
                )}
              </div>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No spending yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add expense transactions to see your breakdown
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setTxDialogOpen(true)}>
                  <Plus className="w-3 h-3" /> Add transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <Card className="xl:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
            <Link
              href="/transactions"
              className="text-xs text-primary hover:underline font-medium"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {data.recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
              {data.recentTransactions.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No transactions yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data.accounts.length === 0
                        ? "Add an account first, then record your income and expenses"
                        : "Start recording your income and expenses"}
                    </p>
                  </div>
                  {data.accounts.length === 0 ? (
                    <ConnectBankButton size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                      Connect bank
                    </ConnectBankButton>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setTxDialogOpen(true)}>
                      <Plus className="w-3 h-3" /> Add transaction
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accounts */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Accounts</CardTitle>
            <Link href="/accounts" className="text-xs text-primary hover:underline font-medium">
              Manage →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.accounts.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No accounts yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect your bank to get started</p>
                </div>
                <ConnectBankButton size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                  Connect bank
                </ConnectBankButton>
              </div>
            )}
            {data.accounts.map((account) => {
              const balance = parseFloat(account.balance);
              const Icon = accountIcons[account.type] ?? Wallet;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: account.color + "22" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: account.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {account.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        balance < 0 ? "text-rose-500" : "text-foreground"
                      }`}
                    >
                      {formatCurrency(balance, account.currency)}
                    </p>
                    {balance < 0 ? (
                      <ArrowDownRight className="w-3 h-3 text-rose-500 ml-auto" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600 ml-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
