import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, transactions, categories } from "@/lib/schema";
import { eq, and, or, isNotNull, inArray } from "drizzle-orm";
import { requireAuth, validateOrigin } from "@/lib/api";
import { getBalance, getTransactions } from "@/lib/truelayer";

async function pairTransfers(userId: number): Promise<number> {
  // Get all TrueLayer-linked accounts for this user
  const linkedAccounts = await db
    .select({ id: accounts.id, currency: accounts.currency })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNotNull(accounts.externalAccountId)));

  if (linkedAccounts.length < 2) return 0;

  const accountIds = linkedAccounts.map((a) => a.id);
  const currencyByAccountId: Record<number, string> = Object.fromEntries(
    linkedAccounts.map((a) => [a.id, a.currency])
  );

  const candidates = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      accountId: transactions.accountId,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        inArray(transactions.accountId, accountIds),
        or(eq(transactions.type, "income"), eq(transactions.type, "expense"))
      )
    );

  const toMark = new Set<number>();

  for (const tx of candidates) {
    if (toMark.has(tx.id) || tx.type !== "expense") continue;

    const txDate = new Date(tx.date).getTime();
    const txAmount = parseFloat(String(tx.amount));
    const txCurrency = currencyByAccountId[tx.accountId];

    const match = candidates.find(
      (other) =>
        !toMark.has(other.id) &&
        other.type === "income" &&
        other.accountId !== tx.accountId &&
        currencyByAccountId[other.accountId] === txCurrency &&
        parseFloat(String(other.amount)) === txAmount &&
        Math.abs(new Date(other.date).getTime() - txDate) <= 24 * 60 * 60 * 1000
    );

    if (match) {
      toMark.add(tx.id);
      toMark.add(match.id);
    }
  }

  if (toMark.size > 0) {
    await db
      .update(transactions)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ type: "transfer" as any, categoryId: null })
      .where(and(eq(transactions.userId, userId), inArray(transactions.id, [...toMark])));
  }

  return toMark.size / 2;
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { accountId } = await req.json();
    if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId!)));

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (!account.externalAccountId || !account.externalAccessToken) {
      return NextResponse.json({ error: "Not a connected bank account" }, { status: 400 });
    }

    const accessToken = account.externalAccessToken;

    // Refresh balance
    const balance = await getBalance(accessToken, account.externalAccountId);
    if (balance === null) {
      // Token likely expired — tell the client to reconnect
      return NextResponse.json(
        { error: "Bank session expired. Please reconnect your bank.", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }

    await db
      .update(accounts)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ balance: String(balance.current), currency: balance.currency } as any)
      .where(eq(accounts.id, accountId));

    // Find or create Uncategorized category
    let uncategorizedId: number | null = null;
    const existingCat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.userId, userId!), eq(categories.name, "Uncategorized")))
      .limit(1);
    if (existingCat.length > 0) {
      uncategorizedId = existingCat[0].id;
    } else {
      const [newCat] = await db
        .insert(categories)
        .values({ userId: userId!, name: "Uncategorized", type: "expense", color: "#94a3b8", icon: "tag" })
        .returning({ id: categories.id });
      uncategorizedId = newCat.id;
    }

    // Sync new transactions
    const tlTransactions = await getTransactions(accessToken, account.externalAccountId);
    let newCount = 0;

    for (const tlTx of tlTransactions) {
      const existingTx = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(eq(transactions.userId, userId!), eq(transactions.externalId, tlTx.transaction_id)))
        .limit(1);
      if (existingTx.length > 0) continue;

      const desc = (tlTx.merchant_name || tlTx.description).toLowerCase();
      const isTransfer = /\b(transfer|tfr|trf|mov(ement)?|between accounts?|own account|internal)\b/.test(desc);
      const isCredit = tlTx.transaction_type === "CREDIT";
      await db.insert(transactions).values({
        userId: userId!,
        accountId,
        description: tlTx.merchant_name || tlTx.description,
        amount: String(Math.abs(tlTx.amount)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: (isTransfer ? "transfer" : isCredit ? "income" : "expense") as any,
        categoryId: isTransfer ? null : uncategorizedId,
        date: new Date(tlTx.timestamp),
        externalId: tlTx.transaction_id,
      });
      newCount++;
    }

    // Detect and mark paired inter-account transfers
    const transferPairs = await pairTransfers(userId!);

    return NextResponse.json({ success: true, newTransactions: newCount, transferPairs, balance: balance.current });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
