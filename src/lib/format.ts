// Soft palette used when a transaction has no category
const FALLBACK_COLORS = [
  "#6aada6", "#6097b5", "#5ea882", "#c49540",
  "#b87272", "#8b79c0", "#be7096", "#c07a55",
  "#7b93a8", "#5b90bf", "#a06db5", "#5aa09a",
];

export function colorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/** Maps currency codes to a representative locale for correct number formatting.
 *  e.g. EUR → "de-DE" uses "." for thousands and "," for decimals (1.234,56 €)
 *       USD → "en-US" uses "," for thousands and "." for decimals ($1,234.56)
 */
const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  CHF: "de-CH",
  CNY: "zh-CN",
  INR: "en-IN",
  BRL: "pt-BR",
  MXN: "es-MX",
  KRW: "ko-KR",
  SGD: "en-SG",
  HKD: "zh-HK",
  NOK: "nb-NO",
  SEK: "sv-SE",
  DKK: "da-DK",
  PLN: "pl-PL",
  NZD: "en-NZ",
  ZAR: "en-ZA",
  TRY: "tr-TR",
  AED: "ar-AE",
  SAR: "ar-SA",
  CZK: "cs-CZ",
  HUF: "hu-HU",
  RON: "ro-RO",
};

export function formatCurrency(amount: number, currency = "USD"): string {
  const locale = CURRENCY_LOCALE[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
