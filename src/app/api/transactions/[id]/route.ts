import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, accounts, categories } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, validateOrigin } from "@/lib/api";
import { transactionPatchSchema } from "@/lib/validate";

async function getOwnedTransaction(txId: number, userId: number) {
  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)));
  return tx ?? null;
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
    const txId = parseInt(id);
    if (isNaN(txId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const tx = await getOwnedTransaction(txId, userId!);
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [acct] = await db
      .select({ externalAccountId: accounts.externalAccountId })
      .from(accounts)
      .where(eq(accounts.id, tx.accountId));

    await db.delete(transactions).where(eq(transactions.id, txId));

    if (tx.type !== "transfer" && !acct?.externalAccountId) {
      const balanceDelta =
        tx.type === "income" ? -parseFloat(String(tx.amount)) : parseFloat(String(tx.amount));
      await db
        .update(accounts)
        .set({ balance: sql`balance + ${balanceDelta}` })
        .where(eq(accounts.id, tx.accountId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
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
    const txId = parseInt(id);
    if (isNaN(txId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const existing = await getOwnedTransaction(txId, userId!);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const result = transactionPatchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [oldAcct] = await db
      .select({ externalAccountId: accounts.externalAccountId })
      .from(accounts)
      .where(eq(accounts.id, existing.accountId));

    // Reverse old balance effect (transfers and TrueLayer accounts are unaffected)
    if (existing.type !== "transfer" && !oldAcct?.externalAccountId) {
      const oldDelta =
        existing.type === "income"
          ? -parseFloat(String(existing.amount))
          : parseFloat(String(existing.amount));
      await db
        .update(accounts)
        .set({ balance: sql`balance + ${oldDelta}` })
        .where(eq(accounts.id, existing.accountId));
    }

    const data = result.data;

    // Verify new accountId belongs to this user (if being changed)
    if (data.accountId && data.accountId !== existing.accountId) {
      const [acct] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, userId!)));
      if (!acct) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
    }

    // Verify new categoryId belongs to this user (if being changed to a non-null value)
    if (data.categoryId != null && data.categoryId !== existing.categoryId) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, data.categoryId), eq(categories.userId, userId!)));
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    const [updated] = await db
      .update(transactions)
      .set({
        description: data.description ?? existing.description,
        amount: data.amount != null ? String(data.amount) : existing.amount,
        type: data.type ?? existing.type,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        accountId: data.accountId ?? existing.accountId,
        date: data.date ? new Date(data.date) : existing.date,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      })
      .where(eq(transactions.id, txId))
      .returning();

    const newAccountId = updated.accountId;
    const [newAcct] = newAccountId === existing.accountId
      ? [oldAcct]
      : await db
          .select({ externalAccountId: accounts.externalAccountId })
          .from(accounts)
          .where(eq(accounts.id, newAccountId));

    if (updated.type !== "transfer" && !newAcct?.externalAccountId) {
      const newDelta =
        updated.type === "income"
          ? parseFloat(String(updated.amount))
          : -parseFloat(String(updated.amount));
      await db
        .update(accounts)
        .set({ balance: sql`balance + ${newDelta}` })
        .where(eq(accounts.id, updated.accountId));
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
