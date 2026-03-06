import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets, transactions } from "@/lib/schema";
import { eq, and, sum, gte, lte } from "drizzle-orm";
import { requireAuth, applyRateLimit, validateOrigin } from "@/lib/api";
import { budgetSchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`budgets-get:${ip}`);
  if (rl) return rl;

  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    const budgetRows = await db.query.budgets.findMany({
      where: and(
        eq(budgets.userId, userId!),
        eq(budgets.month, month),
        eq(budgets.year, year)
      ),
      with: { category: true },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const result = await Promise.all(
      budgetRows.map(async (budget) => {
        const [{ total }] = await db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId!),
              eq(transactions.categoryId, budget.categoryId),
              eq(transactions.type, "expense"),
              gte(transactions.date, startOfMonth),
              lte(transactions.date, endOfMonth)
            )
          );
        return { ...budget, spent: parseFloat(String(total || 0)) };
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`budgets-post:${userId}:${ip}`, 20);
  if (rl) return rl;

  try {
    const body = await req.json();
    const result = budgetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    const { categoryId, amount, month, year } = result.data;
    const [budget] = await db
      .insert(budgets)
      .values({ userId: userId!, categoryId, amount: String(amount), month, year })
      .returning();

    return NextResponse.json(budget, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
