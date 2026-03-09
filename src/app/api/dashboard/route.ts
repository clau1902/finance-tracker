import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, accounts, budgets } from "@/lib/schema";
import { eq, sum, desc, gte, lte, and, count } from "drizzle-orm";
import { requireAuth, applyRateLimit } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`dashboard:${ip}`);
  if (rl) return rl;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId!));

    const totalBalance = allAccounts.reduce(
      (s, a) => s + parseFloat(String(a.balance)),
      0
    );

    const [{ income: monthIncome }] = await db
      .select({ income: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId!),
          eq(transactions.type, "income"),
          gte(transactions.date, startOfMonth)
        )
      );

    const [{ expense: monthExpense }] = await db
      .select({ expense: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId!),
          eq(transactions.type, "expense"),
          gte(transactions.date, startOfMonth)
        )
      );

    const [{ lastIncome: lastMonthIncome }] = await db
      .select({ lastIncome: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId!),
          eq(transactions.type, "income"),
          gte(transactions.date, startOfLastMonth),
          lte(transactions.date, endOfLastMonth)
        )
      );

    const [{ lastExpense: lastMonthExpense }] = await db
      .select({ lastExpense: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId!),
          eq(transactions.type, "expense"),
          gte(transactions.date, startOfLastMonth),
          lte(transactions.date, endOfLastMonth)
        )
      );

    const recentTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId!),
      with: { category: true, account: true },
      orderBy: [desc(transactions.date)],
      limit: 8,
    });

    // Monthly trend — last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [{ inc }] = await db
        .select({ inc: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId!),
            eq(transactions.type, "income"),
            gte(transactions.date, mStart),
            lte(transactions.date, mEnd)
          )
        );

      const [{ exp }] = await db
        .select({ exp: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId!),
            eq(transactions.type, "expense"),
            gte(transactions.date, mStart),
            lte(transactions.date, mEnd)
          )
        );

      monthlyTrend.push({
        month: mStart.toLocaleDateString("en-US", { month: "short" }),
        income: parseFloat(String(inc || 0)),
        expenses: parseFloat(String(exp || 0)),
      });
    }

    // Spending by category this month
    const categorySpending = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId!),
        eq(transactions.type, "expense"),
        gte(transactions.date, startOfMonth)
      ),
      with: { category: true },
    });

    // Spending by category last month (for trends)
    const lastMonthCategorySpending = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId!),
        eq(transactions.type, "expense"),
        gte(transactions.date, startOfLastMonth),
        lte(transactions.date, endOfLastMonth)
      ),
      with: { category: true },
    });

    const catMap: Record<string, { name: string; color: string; total: number; lastMonthTotal: number }> = {};
    for (const tx of categorySpending) {
      const cat = tx.category;
      if (!cat) continue;
      if (!catMap[cat.name]) {
        catMap[cat.name] = { name: cat.name, color: cat.color, total: 0, lastMonthTotal: 0 };
      }
      catMap[cat.name].total += parseFloat(String(tx.amount));
    }
    for (const tx of lastMonthCategorySpending) {
      const cat = tx.category;
      if (!cat) continue;
      if (!catMap[cat.name]) {
        catMap[cat.name] = { name: cat.name, color: cat.color, total: 0, lastMonthTotal: 0 };
      }
      catMap[cat.name].lastMonthTotal += parseFloat(String(tx.amount));
    }
    const spendingByCategory = Object.values(catMap)
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    const [{ budgetCount }] = await db
      .select({ budgetCount: count() })
      .from(budgets)
      .where(eq(budgets.userId, userId!));

    return NextResponse.json({
      totalBalance,
      monthIncome: parseFloat(String(monthIncome || 0)),
      monthExpense: parseFloat(String(monthExpense || 0)),
      lastMonthIncome: parseFloat(String(lastMonthIncome || 0)),
      lastMonthExpense: parseFloat(String(lastMonthExpense || 0)),
      monthlySavings:
        parseFloat(String(monthIncome || 0)) - parseFloat(String(monthExpense || 0)),
      accounts: allAccounts,
      recentTransactions,
      monthlyTrend,
      spendingByCategory,
      hasBudgets: budgetCount > 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
