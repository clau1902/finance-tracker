import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import {
  exchangeCode,
  getAccounts,
  getBalance,
  getTransactions,
  mapAccountType,
  colorForType,
} from "@/lib/truelayer";
import { db } from "@/lib/db";
import { accounts, transactions, categories } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
  const errorUrl = `${origin}/dashboard?bank_error=1`;
  const successUrl = `${origin}/dashboard?bank_connected=1`;

  const { userId, error } = await requireAuth();
  if (error) return NextResponse.redirect(errorUrl);

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const errorParam = params.get("error");

  if (errorParam || !code) {
    return NextResponse.redirect(errorUrl);
  }

  try {
    const redirectUri = `${origin}/api/truelayer/callback`;

    const accessToken = await exchangeCode(
      code,
      process.env.TRUELAYER_CLIENT_ID!,
      process.env.TRUELAYER_CLIENT_SECRET!,
      redirectUri
    );

    const tlAccounts = await getAccounts(accessToken);

    // Find or create "Uncategorized" category once per user
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
        .values({
          userId: userId!,
          name: "Uncategorized",
          type: "expense",
          color: "#94a3b8",
          icon: "tag",
        })
        .returning({ id: categories.id });
      uncategorizedId = newCat.id;
    }

    for (const tlAccount of tlAccounts) {
      // Find existing or insert new account
      let dbAccountId: number;

      const existing = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId!),
            eq(accounts.externalAccountId, tlAccount.account_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        dbAccountId = existing[0].id;
        // Refresh the access token and currency so syncing works after reconnect
        await db
          .update(accounts)
          .set({ externalAccessToken: accessToken, currency: tlAccount.currency })
          .where(eq(accounts.id, dbAccountId));
      } else {
        const balance = await getBalance(accessToken, tlAccount.account_id);
        const type = mapAccountType(tlAccount.account_type);

        const [inserted] = await db
          .insert(accounts)
          .values({
            userId: userId!,
            name: tlAccount.display_name || tlAccount.provider.display_name,
            type,
            balance: String(balance?.current ?? 0),
            currency: tlAccount.currency,
            color: colorForType(type),
            externalAccountId: tlAccount.account_id,
            externalAccessToken: accessToken,
          })
          .returning({ id: accounts.id });

        dbAccountId = inserted.id;
      }

      // Sync transactions for this account
      const tlTransactions = await getTransactions(accessToken, tlAccount.account_id);

      for (const tlTx of tlTransactions) {
        const existingTx = await db
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId!),
              eq(transactions.externalId, tlTx.transaction_id)
            )
          )
          .limit(1);
        if (existingTx.length > 0) continue;

        const isCredit = tlTx.transaction_type === "CREDIT";
        await db.insert(transactions).values({
          userId: userId!,
          accountId: dbAccountId,
          description: tlTx.merchant_name || tlTx.description,
          amount: String(Math.abs(tlTx.amount)),
          type: isCredit ? "income" : "expense",
          categoryId: uncategorizedId,
          date: new Date(tlTx.timestamp),
          externalId: tlTx.transaction_id,
        });
      }
    }

    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(errorUrl);
  }
}
