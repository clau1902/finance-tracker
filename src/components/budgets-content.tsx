"use client";

import { useEffect, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { Plus, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Trash2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface Budget {
  id: number;
  amount: string;
  spent: number;
  month: number;
  year: number;
  category: { id: number; name: string; color: string; icon: string } | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BudgetsContent() {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchBudgets = useCallback(async (month = viewMonth, year = viewYear) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    fetchBudgets(viewMonth, viewYear);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats: Category[]) =>
        setCategories(Array.isArray(cats) ? cats.filter((c) => c.type === "expense") : [])
      );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth, viewYear]);

  useAutoRefresh(fetchBudgets, 30_000);

  const navigateMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setViewMonth(m);
    setViewYear(y);
  };

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const daysLeftInMonth = (() => {
    if (!isCurrentMonth) return null;
    const lastDay = new Date(viewYear, viewMonth, 0).getDate();
    return lastDay - now.getDate();
  })();

  const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const overCount = budgets.filter((b) => b.spent > parseFloat(b.amount)).length;
  const warnCount = budgets.filter((b) => {
    const pct = parseFloat(b.amount) > 0 ? (b.spent / parseFloat(b.amount)) * 100 : 0;
    return pct > 80 && pct <= 100;
  }).length;
  const okCount = budgets.length - overCount - warnCount;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: parseInt(form.categoryId),
          amount: parseFloat(form.amount),
          month: viewMonth,
          year: viewYear,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ categoryId: "", amount: "" });
        toast.success("Budget saved");
        fetchBudgets();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save budget");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    const res = await fetch(`/api/budgets/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) {
      toast.success("Budget deleted");
      fetchBudgets();
    } else {
      toast.error("Failed to delete budget");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budgets</h1>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary transition-colors text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground min-w-[130px] text-center">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              disabled={isCurrentMonth}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>New Budget — {MONTH_NAMES[viewMonth - 1]} {viewYear}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Limit ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Budget"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall summary */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overall Budget
              </p>
              <p className="text-2xl font-semibold mt-0.5">
                {formatCurrency(totalSpent)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  / {formatCurrency(totalBudgeted)}
                </span>
              </p>
            </div>
            <Badge
              variant={overallPct > 100 ? "destructive" : overallPct > 80 ? "outline" : "secondary"}
              className={overallPct > 80 && overallPct <= 100 ? "border-amber-400 text-amber-700 bg-amber-50" : ""}
            >
              {overallPct.toFixed(0)}% used
            </Badge>
          </div>
          <Progress
            value={Math.min(overallPct, 100)}
            className={`h-2.5 ${overallPct > 100 ? "[&>div]:bg-rose-500" : overallPct > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}`}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {formatCurrency(Math.max(0, totalBudgeted - totalSpent))} remaining
              {daysLeftInMonth !== null && (
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <CalendarClock className="w-3 h-3" />
                  {daysLeftInMonth === 0 ? "last day" : `${daysLeftInMonth}d left`}
                </span>
              )}
            </p>
            {budgets.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                {okCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {okCount} on track
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {warnCount} warning
                  </span>
                )}
                {overCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-500">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    {overCount} over
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 opacity-40" />
          </div>
          <p className="font-medium">No budgets for this month</p>
          <p className="text-sm mt-1">Add a budget to start tracking your spending</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const limit = parseFloat(budget.amount);
            const pct = limit > 0 ? (budget.spent / limit) * 100 : 0;
            const over = pct > 100;
            const warn = pct > 80 && !over;

            return (
              <Card key={budget.id} className="border-border/60 shadow-sm group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: (budget.category?.color ?? "#64748b") + "22",
                      }}
                    >
                      <span
                        className="text-base italic"
                        style={{ color: budget.category?.color ?? "#64748b", fontFamily: "var(--font-playfair)" }}
                      >
                        {budget.category?.name.charAt(0) ?? "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {budget.category?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent)} of {formatCurrency(limit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {over ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      ) : warn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-rose-500 transition-colors"
                        onClick={() => setDeleteId(budget.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-2.5 ${
                      over
                        ? "[&>div]:bg-rose-500"
                        : warn
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-primary"
                    }`}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs font-medium ${
                        over
                          ? "text-rose-500"
                          : warn
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {over
                        ? `${formatCurrency(budget.spent - limit)} over budget`
                        : `${formatCurrency(limit - budget.spent)} left`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the budget limit for this category. Your transaction history won&apos;t be affected.
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
    </div>
  );
}
