import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import {
  exchangeCode,
  getAccounts,
  getBalance,
  mapAccountType,
  colorForType,
} from "@/lib/truelayer";
import { db } from "@/lib/db";
import { accounts } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
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

    for (const tlAccount of tlAccounts) {
      // Skip duplicates already imported for this user
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

      if (existing.length > 0) continue;

      const balance = await getBalance(accessToken, tlAccount.account_id);
      const type = mapAccountType(tlAccount.account_type);

      await db.insert(accounts).values({
        userId: userId!,
        name: tlAccount.display_name || tlAccount.provider.display_name,
        type,
        balance: String(balance?.current ?? 0),
        color: colorForType(type),
        externalAccountId: tlAccount.account_id,
        externalAccessToken: accessToken,
      });
    }

    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(errorUrl);
  }
}
