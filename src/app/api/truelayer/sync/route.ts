import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, transactions, categories } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, validateOrigin } from "@/lib/api";
import { getBalance, getTransactions } from "@/lib/truelayer";

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
      .set({ balance: String(balance.current), currency: balance.currency })
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

      const isCredit = tlTx.transaction_type === "CREDIT";
      await db.insert(transactions).values({
        userId: userId!,
        accountId,
        description: tlTx.merchant_name || tlTx.description,
        amount: String(Math.abs(tlTx.amount)),
        type: isCredit ? "income" : "expense",
        categoryId: uncategorizedId,
        date: new Date(tlTx.timestamp),
        externalId: tlTx.transaction_id,
      });
      newCount++;
    }

    return NextResponse.json({ success: true, newTransactions: newCount, balance: balance.current });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
