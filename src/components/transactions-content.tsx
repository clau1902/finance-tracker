"use client";

import { useEffect, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useSearchParams } from "next/navigation";
import { Search, Trash2, Pencil, X, FilterX, Download, ChevronDown, CalendarRange, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: number;
  description: string;
  amount: string;
  type: "income" | "expense" | "transfer";
  date: string;
  notes?: string | null;
  categoryId?: number | null;
  accountId?: number | null;
  externalId?: string | null;
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string; currency: string } | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
  externalAccountId?: string | null;
}

function SkeletonRows() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </>
  );
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get("accountId") ?? "all";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState(initialAccountId);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 50;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (accountFilter !== "all") params.set("accountId", accountFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, accountFilter, fromDate, toDate, debouncedSearch]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(transactions.length) });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (accountFilter !== "all") params.set("accountId", accountFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [transactions.length, typeFilter, categoryFilter, accountFilter, fromDate, toDate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchTransactions();
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
  }, [fetchTransactions]);

  useAutoRefresh(fetchTransactions, 30_000);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setAddDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    const res = await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) {
      toast.success("Transaction deleted");
      fetchTransactions();
    } else {
      toast.error("Failed to delete transaction");
    }
  };

  const handleEditClick = (tx: Transaction) => {
    setEditTx(tx);
    setEditOpen(true);
  };

  const handleCategoryChange = async (txId: number, categoryId: number | null) => {
    const res = await fetch(`/api/transactions/${txId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    if (res.ok) {
      toast.success(categoryId ? "Category updated" : "Category removed");
      fetchTransactions();
    } else {
      toast.error("Failed to update category");
    }
  };

  const exportCsv = () => {
    const header = ["Date", "Description", "Type", "Amount", "Category", "Account"];
    const rows = filtered.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type,
      tx.amount,
      tx.category?.name ?? "",
      tx.account?.name ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    search !== "" || typeFilter !== "all" || categoryFilter !== "all" || accountFilter !== "all" || fromDate !== "" || toDate !== "";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAccountFilter("all");
    setFromDate("");
    setToDate("");
  };

  const filtered = transactions;

  // Group totals by currency — exclude transfers
  const currencyTotals = filtered.reduce<Record<string, { income: number; expense: number }>>((acc, tx) => {
    if (tx.type === "transfer") return acc;
    const cur = tx.account?.currency ?? "USD";
    if (!acc[cur]) acc[cur] = { income: 0, expense: 0 };
    if (tx.type === "income") acc[cur].income += parseFloat(tx.amount);
    else acc[cur].expense += parseFloat(tx.amount);
    return acc;
  }, {});
  const currencies = Object.keys(currencyTotals);
  const isMultiCurrency = currencies.length > 1;

  // Single-currency totals (used when uniform)
  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  // Per-account breakdown (only meaningful when showing all accounts)
  const accountBreakdown = accounts
    .filter((a) => filtered.some((tx) => tx.accountId === a.id))
    .map((a) => {
      const txs = filtered.filter((tx) => tx.accountId === a.id && tx.type !== "transfer");
      const income = txs.filter((tx) => tx.type === "income").reduce((s, tx) => s + parseFloat(tx.amount), 0);
      const expense = txs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + parseFloat(tx.amount), 0);
      const currency = txs[0]?.account?.currency ?? "USD";
      return { account: a, income, expense, net: income - expense, currency };
    });

  // Group by date label
  const groups: { label: string; items: Transaction[] }[] = [];
  for (const tx of filtered) {
    const label = getDateLabel(tx.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(tx);
    } else {
      groups.push({ label, items: [tx] });
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          )}
          <AddTransactionDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onSuccess={fetchTransactions}
          />
        </div>
      </div>

      {/* Summary bar */}
      {isMultiCurrency ? (
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2 bg-secondary/40 border-b border-border/40">
            <span>Income</span>
            <span>Expenses</span>
            <span>Net</span>
          </div>
          {currencies.map((cur) => {
            const { income, expense } = currencyTotals[cur];
            const net = income - expense;
            return (
              <div key={cur} className="grid grid-cols-3 px-4 py-2.5 border-b border-border/30 last:border-0 text-sm">
                <span className="font-semibold text-emerald-600">+{formatCurrency(income, cur)}</span>
                <span className="font-semibold text-rose-500">-{formatCurrency(expense, cur)}</span>
                <span className={`font-semibold ${net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {net >= 0 ? "+" : ""}{formatCurrency(net, cur)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3.5">
            <p className="text-xs text-emerald-700 font-medium">Total Income</p>
            <p className="text-lg font-semibold text-emerald-700 mt-0.5">
              +{formatCurrency(totalIncome, currencies[0] ?? "USD")}
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3.5">
            <p className="text-xs text-rose-600 font-medium">Total Expenses</p>
            <p className="text-lg font-semibold text-rose-600 mt-0.5">
              -{formatCurrency(totalExpense, currencies[0] ?? "USD")}
            </p>
          </div>
          <div className="bg-secondary border border-border/60 rounded-xl p-3.5">
            <p className="text-xs text-muted-foreground font-medium">Net</p>
            <p
              className={`text-lg font-semibold mt-0.5 ${
                totalIncome - totalExpense >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {totalIncome - totalExpense >= 0 ? "+" : ""}
              {formatCurrency(totalIncome - totalExpense, currencies[0] ?? "USD")}
            </p>
          </div>
        </div>
      )}

      {/* Per-account breakdown */}
      {accountFilter === "all" && accountBreakdown.length > 1 && (
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-secondary/40 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Breakdown by account
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-secondary/20 border-b border-border/40">
            <span className="flex-1">Account</span>
            <span className="hidden sm:block w-28 text-right">Income</span>
            <span className="hidden sm:block w-28 text-right">Expenses</span>
            <span className="w-24 text-right">Net</span>
          </div>
          <div className="divide-y divide-border/40">
            {accountBreakdown.map(({ account, income, expense, net, currency }) => (
              <div key={account.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-medium truncate">{account.name}</span>
                  {account.externalAccountId && (
                    <span className="hidden xs:flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <Zap className="w-2.5 h-2.5" />
                      TrueLayer
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-emerald-600 tabular-nums w-28 text-right">
                  +{formatCurrency(income, currency)}
                </span>
                <span className="hidden sm:block text-rose-500 tabular-nums w-28 text-right">
                  -{formatCurrency(expense, currency)}
                </span>
                <span
                  className={`tabular-nums w-24 text-right font-semibold ${
                    net >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {net >= 0 ? "+" : ""}{formatCurrency(net, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                <span className="flex items-center gap-1.5">
                  {a.name}
                  {a.externalAccountId && (
                    <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <CalendarRange className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-36 h-9 text-sm"
            title="From date"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-36 h-9 text-sm"
            title="To date"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: "This month", getRange: () => { const n = new Date(); return { from: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, to: '' }; } },
            { label: "Last month", getRange: () => { const n = new Date(); const m = n.getMonth() === 0 ? 11 : n.getMonth()-1; const y = n.getMonth() === 0 ? n.getFullYear()-1 : n.getFullYear(); const last = new Date(y, m+1, 0); return { from: `${y}-${String(m+1).padStart(2,'0')}-01`, to: `${y}-${String(m+1).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}` }; } },
            { label: "Last 3 months", getRange: () => { const n = new Date(); const from = new Date(n.getFullYear(), n.getMonth()-2, 1); return { from: `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}-01`, to: '' }; } },
            { label: "This year", getRange: () => { return { from: `${new Date().getFullYear()}-01-01`, to: '' }; } },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => { const r = preset.getRange(); setFromDate(r.from); setToDate(r.to); }}
              className="text-xs px-2 py-1 rounded-md border border-border/60 bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <FilterX className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Transaction list */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
              <p className="text-sm font-medium text-foreground">
                {hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : "Add your first transaction to get started"}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                  <FilterX className="w-3.5 h-3.5" />
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1.5">
                  Add transaction
                </Button>
              )}
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="px-5 py-2 bg-secondary/40 border-b border-border/40 sticky top-0 z-10">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.label}
                    </span>
                  </div>
                  <div className="divide-y divide-border/70">
                    {group.items.map((tx) => {
                      const amount = parseFloat(tx.amount);
                      const isIncome = tx.type === "income";
                      const isTransfer = tx.type === "transfer";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 px-3 sm:px-5 py-3.5 hover:bg-secondary/40 transition-colors group"
                        >
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-base italic"
                            style={{ backgroundColor: tx.category?.color ?? "#6aada6", fontFamily: "var(--font-playfair)" }}
                          >
                            {tx.description.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tx.description}</p>
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground/70 truncate mt-0.5 italic">
                                {tx.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="flex items-center gap-0.5 group/cat">
                                    {tx.category ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs py-0 h-4 cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{
                                          backgroundColor: tx.category.color + "22",
                                          color: tx.category.color,
                                          borderColor: tx.category.color + "44",
                                        }}
                                      >
                                        {tx.category.name}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors border border-dashed border-border rounded px-1.5 py-0">
                                        + category
                                      </span>
                                    )}
                                    <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40 opacity-0 group-hover/cat:opacity-100 transition-opacity ml-0.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                    Assign category
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {categories
                                    .filter((c) => c.type === tx.type)
                                    .map((cat) => (
                                      <DropdownMenuItem
                                        key={cat.id}
                                        onClick={() => handleCategoryChange(tx.id, cat.id)}
                                        className="gap-2"
                                      >
                                        <span
                                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: cat.color }}
                                        />
                                        {cat.name}
                                        {tx.categoryId === cat.id && (
                                          <span className="ml-auto text-primary">✓</span>
                                        )}
                                      </DropdownMenuItem>
                                    ))}
                                  {tx.categoryId && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleCategoryChange(tx.id, null)}
                                        className="text-muted-foreground"
                                      >
                                        Remove category
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <span className="text-xs text-muted-foreground">
                                {tx.account?.name} · {formatDate(tx.date)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-sm font-semibold tabular-nums ${
                                isTransfer
                                  ? "text-muted-foreground"
                                  : isIncome
                                  ? "text-emerald-600"
                                  : "text-rose-500"
                              }`}
                            >
                              {isTransfer ? "⇄ " : isIncome ? "+" : "-"}
                              {formatCurrency(amount, tx.account?.currency ?? "USD")}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-primary transition-all"
                              onClick={() => handleEditClick(tx)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-rose-500 transition-all"
                              onClick={() => setDeleteId(tx.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="flex justify-center py-4 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="gap-1.5"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the transaction and reverse its effect on the account balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      {editTx && (
        <AddTransactionDialog
          transaction={editTx}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditTx(null);
          }}
          onSuccess={fetchTransactions}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  );
}
