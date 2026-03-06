"use client";

import { useEffect, useState } from "react";
import { Plus, CreditCard, Landmark, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency } from "@/lib/format";

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

  const totalNetWorth = accounts.reduce(
    (sum, a) => sum + parseFloat(a.balance),
    0
  );

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
        fetchAccounts();
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Account
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

      {/* Net Worth Card */}
      <Card className="border-border/60 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
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
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
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
                        className="w-5.5 h-5.5"
                        style={{ color: account.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: account.color + "18",
                        color: account.color,
                      }}
                    >
                      {account.type}
                    </span>
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
                  <div
                    className="mt-3 h-1 rounded-full"
                    style={{ backgroundColor: account.color + "33" }}
                  >
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        backgroundColor: account.color,
                        width: isNegative ? "100%" : "60%",
                      }}
                    />
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
