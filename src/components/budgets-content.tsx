"use client";

import { useEffect, useState } from "react";
import { Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function BudgetsContent() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      setBudgets(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats: Category[]) =>
        setCategories(cats.filter((c) => c.type === "expense"))
      );
  }, []);

  const totalBudgeted = budgets.reduce(
    (sum, b) => sum + parseFloat(b.amount),
    0
  );
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          amount: parseFloat(form.amount),
          month,
          year,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ categoryId: "", amount: "" });
        fetchBudgets();
      }
    } finally {
      setSaving(false);
    }
  };

  const monthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{monthName}</p>
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
              <DialogTitle>New Budget</DialogTitle>
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
            className={`h-2 ${overallPct > 100 ? "[&>div]:bg-rose-500" : overallPct > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}`}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {formatCurrency(Math.max(0, totalBudgeted - totalSpent))} remaining
          </p>
        </CardContent>
      </Card>

      {/* Budget list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PiggyBankIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No budgets yet</p>
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
              <Card key={budget.id} className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor:
                          (budget.category?.color ?? "#64748b") + "22",
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: budget.category?.color ?? "#64748b" }}
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
                    {over ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    ) : warn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-1.5 ${
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
    </div>
  );
}

function PiggyBankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V17m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008Zm-7.5-12h.008v.008H6.75v-.008Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5h15v11.25H4.5V10.5Z" />
    </svg>
  );
}
