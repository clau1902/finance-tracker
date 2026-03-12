"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "displayCurrency";

export function useDisplayCurrency() {
  const [displayCurrency, setDisplayCurrencyState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setDisplayCurrencyState(stored);
  }, []);

  function setDisplayCurrency(currency: string | null) {
    if (currency) {
      localStorage.setItem(STORAGE_KEY, currency);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setDisplayCurrencyState(currency);
  }

  return { displayCurrency, setDisplayCurrency };
}
