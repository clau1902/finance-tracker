import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, accounts, budgets } from "@/lib/schema";
import { eq, sum, desc, gte, lte, and, count, lt } from "drizzle-orm";
import { requireAuth, applyRateLimit } from "@/lib/api";
import { getExchangeRates, sumConverted } from "@/lib/fx";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`dashboard:${ip}`);
  if (rl) return rl;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId!));

    // Total balance grouped by currency
    const balanceByCurrency: Record<string, number> = {};
    for (const a of allAccounts) {
      balanceByCurrency[a.currency] =
        (balanceByCurrency[a.currency] || 0) + parseFloat(String(a.balance));
    }

    // Helper: group a sum query result into a Record<currency, number>
    function toMap(rows: { currency: string; total: string | null }[]) {
      const map: Record<string, number> = {};
      for (const r of rows) map[r.currency] = parseFloat(String(r.total || 0));
      return map;
    }

    // Income/expense this month — grouped by account currency
    const monthIncomeRows = await db
      .select({ currency: accounts.currency, total: sum(transactions.amount) })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(eq(transactions.userId, userId!), eq(transactions.type, "income"),
        gte(transactions.date, startOfMonth), lt(transactions.date, startOfNextMonth)))
      .groupBy(accounts.currency);

    const monthExpenseRows = await db
      .select({ currency: accounts.currency, total: sum(transactions.amount) })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(eq(transactions.userId, userId!), eq(transactions.type, "expense"),
        gte(transactions.date, startOfMonth), lt(transactions.date, startOfNextMonth)))
      .groupBy(accounts.currency);

    // Income/expense last month — grouped by account currency
    const lastMonthIncomeRows = await db
      .select({ currency: accounts.currency, total: sum(transactions.amount) })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(eq(transactions.userId, userId!), eq(transactions.type, "income"),
        gte(transactions.date, startOfLastMonth), lte(transactions.date, endOfLastMonth)))
      .groupBy(accounts.currency);

    const lastMonthExpenseRows = await db
      .select({ currency: accounts.currency, total: sum(transactions.amount) })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(eq(transactions.userId, userId!), eq(transactions.type, "expense"),
        gte(transactions.date, startOfLastMonth), lte(transactions.date, endOfLastMonth)))
      .groupBy(accounts.currency);

    const monthIncomeByCurrency = toMap(monthIncomeRows);
    const monthExpenseByCurrency = toMap(monthExpenseRows);
    const lastMonthIncomeByCurrency = toMap(lastMonthIncomeRows);
    const lastMonthExpenseByCurrency = toMap(lastMonthExpenseRows);

    // Savings = income - expense per currency
    const allCurrencies = Object.keys(balanceByCurrency);
    const monthlySavingsByCurrency: Record<string, number> = {};
    for (const c of allCurrencies) {
      monthlySavingsByCurrency[c] =
        (monthIncomeByCurrency[c] ?? 0) - (monthExpenseByCurrency[c] ?? 0);
    }

    // Primary currency = most accounts (used for the trend chart)
    const currencyCount: Record<string, number> = {};
    for (const a of allAccounts) currencyCount[a.currency] = (currencyCount[a.currency] || 0) + 1;
    const primaryCurrency =
      Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";

    // FX conversion — use displayCurrency from query param, or fall back to primaryCurrency
    const displayCurrency =
      req.nextUrl.searchParams.get("displayCurrency") ?? primaryCurrency;

    let fxRates: Record<string, number> = {};
    let convertedTotalBalance: number | null = null;
    let convertedMonthIncome: number | null = null;
    let convertedMonthExpense: number | null = null;
    let convertedMonthlySavings: number | null = null;

    const needsConversion =
      allCurrencies.length > 1 || displayCurrency !== primaryCurrency;

    if (needsConversion) {
      fxRates = await getExchangeRates(displayCurrency);
      convertedTotalBalance = sumConverted(balanceByCurrency, displayCurrency, fxRates);
      convertedMonthIncome = sumConverted(monthIncomeByCurrency, displayCurrency, fxRates);
      convertedMonthExpense = sumConverted(monthExpenseByCurrency, displayCurrency, fxRates);
      convertedMonthlySavings = sumConverted(monthlySavingsByCurrency, displayCurrency, fxRates);
    }

    const recentTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId!),
      with: { category: true, account: true },
      orderBy: [desc(transactions.date)],
      limit: 8,
    });

    // Monthly trend — last 6 months (primary currency only)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const [{ inc }] = await db
        .select({ inc: sum(transactions.amount) })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            eq(transactions.userId, userId!),
            eq(transactions.type, "income"),
            eq(accounts.currency, primaryCurrency),
            gte(transactions.date, mStart),
            lte(transactions.date, mEnd)
          )
        );

      const [{ exp }] = await db
        .select({ exp: sum(transactions.amount) })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            eq(transactions.userId, userId!),
            eq(transactions.type, "expense"),
            eq(accounts.currency, primaryCurrency),
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
      primaryCurrency,
      displayCurrency,
      balanceByCurrency,
      monthIncomeByCurrency,
      monthExpenseByCurrency,
      lastMonthIncomeByCurrency,
      lastMonthExpenseByCurrency,
      monthlySavingsByCurrency,
      // Converted totals (null when only one currency — no conversion needed)
      convertedTotalBalance,
      convertedMonthIncome,
      convertedMonthExpense,
      convertedMonthlySavings,
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
