"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

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
}

interface AddTransactionDialogProps {
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transaction?: Transaction;
  trigger?: React.ReactNode;
}

export function AddTransactionDialog({
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  transaction,
  trigger,
}: AddTransactionDialogProps) {
  const isEditing = !!transaction;
  const isFromBank = !!transaction?.externalId;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultForm = {
    description: "",
    amount: "",
    type: "expense" as "income" | "expense" | "transfer",
    categoryId: "",
    accountId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  };

  const [form, setForm] = useState(defaultForm);

  // Sync form when editing transaction changes
  useEffect(() => {
    if (transaction && open) {
      setForm({
        description: transaction.description,
        amount: parseFloat(transaction.amount).toString(),
        type: transaction.type,
        categoryId: transaction.categoryId ? String(transaction.categoryId) : "",
        accountId: transaction.accountId ? String(transaction.accountId) : "",
        date: transaction.date.split("T")[0],
        notes: transaction.notes ?? "",
      });
    } else if (!open) {
      setForm(defaultForm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  useEffect(() => {
    if (open) {
      fetch("/api/categories").then((r) => r.json()).then(setCategories);
      fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    }
  }, [open]);

  const filteredCategories = categories.filter((c) => c.type === form.type || form.type === "transfer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.accountId) return;

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/transactions/${transaction.id}`
        : "/api/transactions";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          categoryId: form.categoryId || null,
          accountId: parseInt(form.accountId),
        }),
      });

      if (res.ok) {
        setOpen(false);
        toast.success(isEditing ? "Transaction updated" : "Transaction added");
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 flex-1 sm:flex-none justify-center">
            {isEditing ? (
              <>
                <Pencil className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Transaction
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "New Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Bank import notice */}
          {isFromBank && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
              <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                This transaction was imported from your bank. The amount, date, and description are locked to preserve accuracy. You can edit the category and notes.
              </p>
            </div>
          )}

          {/* Type toggle */}
          <div className={`flex rounded-lg overflow-hidden border border-border ${isFromBank ? "opacity-50 pointer-events-none" : ""}`}>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === "expense"
                  ? "bg-rose-500 text-white"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
              onClick={() => setForm({ ...form, type: "expense", categoryId: "" })}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === "income"
                  ? "bg-emerald-600 text-white"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
              onClick={() => setForm({ ...form, type: "income", categoryId: "" })}
            >
              Income
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === "transfer"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
              onClick={() => setForm({ ...form, type: "transfer", categoryId: "" })}
            >
              Transfer
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Grocery shopping"
                required
                disabled={isFromBank}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={isFromBank}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                disabled={isFromBank}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Account</Label>
              <Select
                value={form.accountId}
                onValueChange={(v) => setForm({ ...form, accountId: v })}
                disabled={isFromBank}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Save Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
