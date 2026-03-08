"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Trash2, Pencil, X, FilterX, Download, ChevronDown, CalendarRange } from "lucide-react";
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
  type: "income" | "expense";
  date: string;
  notes?: string | null;
  categoryId?: number | null;
  accountId?: number | null;
  externalId?: string | null;
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string } | null;
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState(initialAccountId);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
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

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, accountFilter, fromDate, toDate]);

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
    fetchTransactions();
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
  }, [fetchTransactions]);

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

  const filtered = transactions.filter((tx) =>
    search
      ? tx.description.toLowerCase().includes(search.toLowerCase()) ||
        tx.category?.name.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

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
          <AddTransactionDialog onSuccess={fetchTransactions} />
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3.5">
          <p className="text-xs text-emerald-700 font-medium">Total Income</p>
          <p className="text-lg font-semibold text-emerald-700 mt-0.5">
            +{formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3.5">
          <p className="text-xs text-rose-600 font-medium">Total Expenses</p>
          <p className="text-lg font-semibold text-rose-600 mt-0.5">
            -{formatCurrency(totalExpense)}
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
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

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
                {a.name}
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
                <AddTransactionDialog onSuccess={fetchTransactions} />
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
                  <div className="divide-y divide-border/50">
                    {group.items.map((tx) => {
                      const amount = parseFloat(tx.amount);
                      const isIncome = tx.type === "income";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors group"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-base italic"
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
                                isIncome ? "text-emerald-600" : "text-rose-500"
                              }`}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-primary transition-all"
                              onClick={() => handleEditClick(tx)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-rose-500 transition-all"
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
