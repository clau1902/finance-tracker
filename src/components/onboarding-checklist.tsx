"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ConnectBankButton } from "@/components/connect-bank-button";

const STORAGE_KEY = "ftk_onboarding_dismissed";

interface OnboardingChecklistProps {
  hasAccounts: boolean;
  hasTransactions: boolean;
  onAddTransaction: () => void;
}

export function OnboardingChecklist({
  hasAccounts,
  hasTransactions,
  onAddTransaction,
}: OnboardingChecklistProps) {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const allDone = hasAccounts && hasTransactions;

  // Auto-dismiss 4s after all core steps complete
  useEffect(() => {
    if (allDone && dismissed === false) {
      const t = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setDismissed(true);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  // Don't render until localStorage is read (avoids hydration flash)
  if (dismissed === null || dismissed === true) return null;

  const firstName = session?.user?.name?.split(" ")[0];
  const completedCount = [hasAccounts, hasTransactions].filter(Boolean).length;

  const steps = [
    {
      id: "account",
      done: hasAccounts,
      title: "Connect your bank",
      description: "Link a bank account via open banking",
      action: (
        <ConnectBankButton size="sm" variant="default" className="gap-1 text-xs h-7">
          Connect <ChevronRight className="w-3 h-3" />
        </ConnectBankButton>
      ),
    },
    {
      id: "transaction",
      done: hasTransactions,
      title: "Log your first transaction",
      description: "Record income or an expense",
      action: (
        <Button
          size="sm"
          variant={hasAccounts ? "default" : "outline"}
          className="gap-1 text-xs h-7 flex-shrink-0"
          onClick={onAddTransaction}
          disabled={!hasAccounts}
          title={!hasAccounts ? "Add an account first" : undefined}
        >
          Add <ChevronRight className="w-3 h-3" />
        </Button>
      ),
    },
    {
      id: "budget",
      done: false,
      title: "Set a spending budget",
      description: "Track how much you spend per category",
      action: (
        <Link href="/budgets">
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7 flex-shrink-0">
            Go <ChevronRight className="w-3 h-3" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {allDone
                ? "You're all set!"
                : `Welcome${firstName ? `, ${firstName}` : ""}! Let's get started.`}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone
              ? "Your dashboard is ready. Closing in a moment..."
              : `${completedCount} of 2 required steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 ml-4 flex-shrink-0"
          aria-label="Dismiss onboarding"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
        <div
          className="h-1.5 bg-primary rounded-full transition-all duration-700"
          style={{ width: `${(completedCount / 2) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              step.done ? "bg-primary/5" : "bg-secondary/60"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium leading-none ${
                  step.done ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
            </div>
            {!step.done && step.action}
          </div>
        ))}
      </div>
    </div>
  );
}
