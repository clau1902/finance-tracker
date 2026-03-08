"use client";

import { formatCurrency, formatDate } from "@/lib/format";

interface TransactionRowProps {
  transaction: {
    id: number;
    description: string;
    amount: string;
    type: "income" | "expense";
    date: string;
    category?: { name: string; color: string; icon: string } | null;
    account?: { name: string } | null;
  };
  onDelete?: (id: number) => void;
}

export function TransactionRow({ transaction, onDelete }: TransactionRowProps) {
  const amount = parseFloat(transaction.amount);
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors group">
      {/* Category dot */}
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-base italic"
        style={{
          backgroundColor: transaction.category?.color ?? "#6aada6",
          fontFamily: "var(--font-playfair)",
        }}
      >
        {transaction.description.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {transaction.category?.name ?? "Uncategorized"} ·{" "}
          {formatDate(transaction.date)}
        </p>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-semibold ${
            isIncome ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(amount)}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all text-xs"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
