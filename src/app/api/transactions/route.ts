import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, accounts, categories } from "@/lib/schema";
import { eq, desc, and, gte, lte, sql, ilike, or } from "drizzle-orm";
import { requireAuth, applyRateLimit, validateOrigin } from "@/lib/api";
import { transactionSchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`tx-get:${ip}`);
  if (rl) return rl;

  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [eq(transactions.userId, userId!)];
    if (accountId) conditions.push(eq(transactions.accountId, parseInt(accountId)));
    if (type === "income" || type === "expense") conditions.push(eq(transactions.type, type));
    if (categoryId) conditions.push(eq(transactions.categoryId, parseInt(categoryId)));
    if (from) conditions.push(gte(transactions.date, new Date(from)));
    if (to) conditions.push(lte(transactions.date, new Date(to)));
    const search = searchParams.get("search");
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(or(ilike(transactions.description, pattern), ilike(transactions.notes, pattern))!);
    }

    const rows = await db.query.transactions.findMany({
      where: and(...conditions),
      with: { category: true, account: true },
      orderBy: [desc(transactions.date)],
      limit,
      offset,
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`tx-post:${userId}:${ip}`, 30);
  if (rl) return rl;

  try {
    const body = await req.json();
    const result = transactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { description, amount, type, categoryId, accountId, date, notes } = result.data;

    // Verify the account belongs to this user
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId!)));
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Verify the category belongs to this user (if provided)
    if (categoryId) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.userId, userId!)));
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: userId!,
        description,
        amount: String(amount),
        type,
        categoryId: categoryId ?? null,
        accountId,
        date: new Date(date),
        notes: notes ?? null,
      })
      .returning();

    if (type !== "transfer") {
      const balanceDelta = type === "income" ? amount : -amount;
      await db
        .update(accounts)
        .set({ balance: sql`balance + ${balanceDelta}` })
        .where(eq(accounts.id, accountId));
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
