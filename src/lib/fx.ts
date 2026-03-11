/** Lightweight FX helper using Frankfurter.app (free, no API key). */

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { rates: Record<string, number>; expires: number }>();

/**
 * Fetch exchange rates with `base` as the reference currency.
 * Returns an object where rates[X] = how many X equal 1 unit of `base`.
 * Falls back to an empty object if the request fails.
 */
export async function getExchangeRates(base: string): Promise<Record<string, number>> {
  const cached = cache.get(base);
  if (cached && Date.now() < cached.expires) return cached.rates;

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?base=${base}`, {
      next: { revalidate: 3600 }, // Next.js cache hint
    });
    if (!res.ok) return {};
    const json = await res.json();
    const rates: Record<string, number> = { ...json.rates, [base]: 1 };
    cache.set(base, { rates, expires: Date.now() + CACHE_TTL });
    return rates;
  } catch {
    return {};
  }
}

/**
 * Convert an amount from `fromCurrency` into `baseCurrency` using `rates`
 * fetched with getExchangeRates(baseCurrency).
 * Returns null if the rate is unavailable.
 */
export function convertToBase(
  amount: number,
  fromCurrency: string,
  baseCurrency: string,
  rates: Record<string, number>
): number | null {
  if (fromCurrency === baseCurrency) return amount;
  const rate = rates[fromCurrency]; // how many fromCurrency = 1 baseCurrency
  if (!rate) return null;
  return amount / rate;
}

/**
 * Sum a per-currency map into a single base-currency total.
 * Currencies whose rates are unavailable are skipped.
 * Returns null if no conversion was possible at all.
 */
export function sumConverted(
  byCurrency: Record<string, number>,
  baseCurrency: string,
  rates: Record<string, number>
): number | null {
  const keys = Object.keys(byCurrency);
  if (keys.length === 0) return null;
  if (keys.length === 1) return byCurrency[keys[0]];

  let total = 0;
  let converted = false;
  for (const [cur, amount] of Object.entries(byCurrency)) {
    const v = convertToBase(amount, cur, baseCurrency, rates);
    if (v !== null) {
      total += v;
      converted = true;
    }
  }
  return converted ? total : null;
}
