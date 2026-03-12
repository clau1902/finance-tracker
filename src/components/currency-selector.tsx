"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
];

interface CurrencySelectorProps {
  value: string | null;
  onChange: (currency: string | null) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = CURRENCIES.find((c) => c.code === value);

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setSearch(""); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm">
          {selected ? (
            <>
              <span className="font-semibold">{selected.code}</span>
              <span className="text-muted-foreground hidden sm:inline">— {selected.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Display currency</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
        {/* Search */}
        <div className="p-2 border-b border-border/60">
          <Input
            placeholder="Search currencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto py-1">
          {/* Clear option */}
          {value && (
            <>
              <DropdownMenuItem
                className="text-xs text-muted-foreground gap-2 cursor-pointer"
                onClick={() => onChange(null)}
              >
                <X className="w-3.5 h-3.5" />
                Show native currencies
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No results</p>
          ) : (
            filtered.map((c) => (
              <DropdownMenuItem
                key={c.code}
                className="gap-2 cursor-pointer text-sm"
                onClick={() => onChange(c.code)}
              >
                <span className="font-mono font-semibold w-8 text-xs">{c.code}</span>
                <span className="flex-1 text-xs text-muted-foreground">{c.name}</span>
                {value === c.code && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
