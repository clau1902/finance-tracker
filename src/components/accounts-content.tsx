"use client";

import { useEffect, useState } from "react";
import { Plus, CreditCard, Landmark, Wallet, TrendingUp, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import { ConnectBankButton } from "@/components/connect-bank-button";


interface Account {
  id: number;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: string;
  color: string;
  createdAt: string;
}

const accountIcons = {
  checking: Wallet,
  savings: Landmark,
  credit: CreditCard,
  investment: TrendingUp,
};

const accountColors: Record<string, string> = {
  checking: "#0d9488",
  savings: "#0891b2",
  credit: "#dc2626",
  investment: "#059669",
};

const accountTypeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  investment: "Investment",
};

export function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
  });

  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState({ name: "", type: "checking" });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      setAccounts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const assets = accounts
    .filter((a) => parseFloat(a.balance) >= 0)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const liabilities = accounts
    .filter((a) => parseFloat(a.balance) < 0)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const totalNetWorth = assets + liabilities;

  const openEdit = (account: Account) => {
    setEditAccount(account);
    setEditForm({ name: account.name, type: account.type });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccount) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/accounts/${editAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          color: accountColors[editForm.type] ?? editAccount.color,
        }),
      });
      if (res.ok) {
        setEditAccount(null);
        toast.success("Account updated");
        fetchAccounts();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to update account");
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (account: Account) => {
    setDeletingId(account.id);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted");
        fetchAccounts();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to delete account");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          balance: parseFloat(form.balance || "0"),
          color: accountColors[form.type] ?? "#64748b",
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ name: "", type: "checking", balance: "" });
        toast.success("Account added");
        fetchAccounts();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to add account");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectBankButton variant="outline" className="gap-2">
            Connect Bank
          </ConnectBankButton>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Manually
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>New Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Account Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Checking"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Account Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Current Balance ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Add Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Edit Account Dialog */}
      <Dialog open={!!editAccount} onOpenChange={(open) => { if (!open) setEditAccount(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Account Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) => setEditForm({ ...editForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Net Worth Card */}
      <Card className="border-border/60 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Net Worth
              </p>
              <p
                className={`text-3xl font-bold mt-1 ${
                  totalNetWorth >= 0 ? "text-foreground" : "text-rose-500"
                }`}
              >
                {formatCurrency(totalNetWorth)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {accounts.length > 0 && (
              <div className="text-right space-y-1">
                <div>
                  <p className="text-xs text-muted-foreground">Assets</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    +{formatCurrency(assets)}
                  </p>
                </div>
                {liabilities < 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Liabilities</p>
                    <p className="text-sm font-semibold text-rose-500">
                      {formatCurrency(liabilities)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6 opacity-40" />
          </div>
          <p className="font-medium text-foreground">No accounts yet</p>
          <p className="text-sm mt-1">Connect your bank or add an account manually</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <ConnectBankButton variant="default" className="gap-2">
              Connect Bank
            </ConnectBankButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const balance = parseFloat(account.balance);
            const Icon = accountIcons[account.type] ?? Wallet;
            const isNegative = balance < 0;

            return (
              <Card
                key={account.id}
                className="border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: account.color + "22" }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: account.color }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor: account.color + "18",
                          color: account.color,
                        }}
                      >
                        {accountTypeLabels[account.type] ?? account.type}
                      </span>
                      <button
                        onClick={() => openEdit(account)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Edit account"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(account)}
                        disabled={deletingId === account.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {account.name}
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      isNegative ? "text-rose-500" : "text-foreground"
                    }`}
                  >
                    {formatCurrency(balance)}
                  </p>
                  <Link
                    href={`/transactions?accountId=${account.id}`}
                    className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    View transactions
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
