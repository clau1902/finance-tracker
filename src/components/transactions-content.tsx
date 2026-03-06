"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string } | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

export function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter]);

  useEffect(() => {
    fetchTransactions();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, [fetchTransactions]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchTransactions();
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
        <AddTransactionDialog onSuccess={fetchTransactions} />
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
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="pl-9"
          />
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
      </div>

      {/* Transaction list */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No transactions found
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((tx) => {
                const amount = parseFloat(tx.amount);
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: tx.category?.color ?? "#64748b" }}
                    >
                      {tx.description.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.category && (
                          <Badge
                            variant="secondary"
                            className="text-xs py-0 h-4"
                            style={{
                              backgroundColor: tx.category.color + "22",
                              color: tx.category.color,
                              borderColor: tx.category.color + "44",
                            }}
                          >
                            {tx.category.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {tx.account?.name} · {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-rose-500 transition-all"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
