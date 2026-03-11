const IS_SANDBOX = process.env.TRUELAYER_SANDBOX !== "false";

export const TRUELAYER_AUTH_URL = IS_SANDBOX
  ? "https://auth.truelayer-sandbox.com"
  : "https://auth.truelayer.com";

export const TRUELAYER_API_URL = IS_SANDBOX
  ? "https://api.truelayer-sandbox.com"
  : "https://api.truelayer.com";

export interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  provider: { display_name: string; provider_id: string };
}

export interface TrueLayerBalance {
  currency: string;
  available: number;
  current: number;
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: "DEBIT" | "CREDIT";
  merchant_name?: string;
}

const TYPE_MAP: Record<string, "checking" | "savings" | "credit" | "investment"> = {
  TRANSACTION: "checking",
  SAVINGS: "savings",
  CREDIT: "credit",
  BUSINESS_TRANSACTION: "checking",
  BUSINESS_SAVINGS: "savings",
};

const COLOR_MAP: Record<string, string> = {
  checking: "#0d9488",
  savings: "#0891b2",
  credit: "#dc2626",
  investment: "#059669",
};

export function mapAccountType(
  tlType: string
): "checking" | "savings" | "credit" | "investment" {
  return TYPE_MAP[tlType?.toUpperCase()] ?? "checking";
}

export function colorForType(type: "checking" | "savings" | "credit" | "investment"): string {
  return COLOR_MAP[type];
}

/** Build the TrueLayer authorization URL to redirect the user to. */
export function buildAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "accounts balance transactions",
    redirect_uri: redirectUri,
    ...(process.env.TRUELAYER_SANDBOX !== "false" && { providers: "mock" }),
  });
  return `${TRUELAYER_AUTH_URL}/?${params.toString()}`;
}

/** Exchange an authorization code for an access token. */
export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch(`${TRUELAYER_AUTH_URL}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TrueLayer token exchange failed: ${text}`);
  }
  const json = await res.json();
  return json.access_token;
}

/** Fetch the user's accounts using an access token. */
export async function getAccounts(accessToken: string): Promise<TrueLayerAccount[]> {
  const res = await fetch(`${TRUELAYER_API_URL}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`TrueLayer getAccounts failed: ${res.status}`);
  }
  const json = await res.json();
  return json.results ?? [];
}

/** Fetch transactions for a single account (defaults to last 90 days). */
export async function getTransactions(
  accessToken: string,
  accountId: string
): Promise<TrueLayerTransaction[]> {
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const res = await fetch(
    `${TRUELAYER_API_URL}/data/v1/accounts/${accountId}/transactions?from=${from}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.results ?? [];
}

/** Fetch the balance for a single account. */
export async function getBalance(
  accessToken: string,
  accountId: string
): Promise<TrueLayerBalance | null> {
  const res = await fetch(
    `${TRUELAYER_API_URL}/data/v1/accounts/${accountId}/balance`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.results?.[0] ?? null;
}
