import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, validateOrigin } from "@/lib/api";
import { accountPatchSchema } from "@/lib/validate";

async function getOwnedAccount(accountId: number, userId: number) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
  return account ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const existing = await getOwnedAccount(accountId, userId!);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const result = accountPatchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const [updated] = await db
      .update(accounts)
      .set({
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        color: data.color ?? existing.color,
      })
      .where(eq(accounts.id, accountId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const existing = await getOwnedAccount(accountId, userId!);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Block deletion if account has transactions
    const [linked] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .limit(1);

    if (linked) {
      return NextResponse.json(
        { error: "Cannot delete an account that has transactions. Delete or reassign its transactions first." },
        { status: 409 }
      );
    }

    await db.delete(accounts).where(eq(accounts.id, accountId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
