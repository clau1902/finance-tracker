"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TransactionRow } from "@/components/transaction-row";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { formatCurrency } from "@/lib/format";

interface DashboardData {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthlySavings: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  spendingByCategory: { name: string; color: string; total: number }[];
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
  color: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: string;
  type: "income" | "expense";
  date: string;
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string } | null;
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    {
      label: "Total Balance",
      value: formatCurrency(data.totalBalance),
      icon: Wallet,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      trend: null,
    },
    {
      label: "Monthly Income",
      value: formatCurrency(data.monthIncome),
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      trend: { positive: true },
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(data.monthExpense),
      icon: TrendingDown,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-100",
      trend: { positive: false },
    },
    {
      label: "Net Savings",
      value: formatCurrency(data.monthlySavings),
      icon: PiggyBank,
      iconColor: data.monthlySavings >= 0 ? "text-teal-600" : "text-rose-500",
      iconBg: data.monthlySavings >= 0 ? "bg-teal-100" : "bg-rose-100",
      trend: null,
    },
  ];

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
        <AddTransactionDialog onSuccess={fetchData} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-2xl font-semibold mt-1 text-foreground">
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
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
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.spendingByCategory}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="name"
                  >
                    {data.spendingByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No spending data this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <Card className="xl:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {data.recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
              {data.recentTransactions.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accounts */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.accounts.map((account) => {
              const balance = parseFloat(account.balance);
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
                      <Wallet className="w-4.5 h-4.5" style={{ color: account.color }} />
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
                      {formatCurrency(balance)}
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
