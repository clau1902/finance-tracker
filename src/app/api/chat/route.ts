import { NextRequest } from "next/server";
import { streamText, tool, stepCountIs, convertToModelMessages, UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactions, accounts, budgets } from "@/lib/schema";
import { eq, and, gte, lte, sum, desc, ilike, or } from "drizzle-orm";
import { requireAuth, applyRateLimit } from "@/lib/api";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const rl = applyRateLimit(`chat:${userId}`, 20);
  if (rl) return rl;

  const { messages }: { messages: UIMessage[] } = await req.json();
  const now = new Date();

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a personal finance assistant built into a finance tracker app.
Today is ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Always use the provided tools to fetch real data before answering questions about finances.
Be concise and clear. Format numbers with their currency symbol. Use bullet points for lists.
Keep responses under 200 words unless the user asks for more detail.`,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    tools: {
      getAccounts: tool({
        description: "Get all the user's accounts with current balances and currencies",
        inputSchema: z.object({}),
        execute: async () => {
          const rows = await db
            .select()
            .from(accounts)
            .where(eq(accounts.userId, userId!));
          return rows.map((a) => ({
            name: a.name,
            type: a.type,
            balance: parseFloat(String(a.balance)),
            currency: a.currency,
            connected: !!a.externalAccountId,
          }));
        },
      }),

      getTransactions: tool({
        description:
          "Get transactions filtered by type, date range, or search term",
        inputSchema: z.object({
          limit: z
            .number()
            .min(1)
            .max(50)
            .default(20)
            .describe("Number of transactions to return"),
          type: z
            .enum(["income", "expense", "all"])
            .default("all")
            .describe("Filter by type"),
          search: z
            .string()
            .optional()
            .describe("Search text in transaction description"),
          fromDate: z
            .string()
            .optional()
            .describe("Start date, ISO format e.g. 2026-03-01"),
          toDate: z
            .string()
            .optional()
            .describe("End date, ISO format e.g. 2026-03-31"),
        }),
        execute: async ({ limit, type, search, fromDate, toDate }) => {
          const conditions = [eq(transactions.userId, userId!)];
          if (type !== "all") conditions.push(eq(transactions.type, type));
          if (fromDate) conditions.push(gte(transactions.date, new Date(fromDate)));
          if (toDate) conditions.push(lte(transactions.date, new Date(toDate)));
          if (search)
            conditions.push(
              or(ilike(transactions.description, `%${search}%`))!
            );

          const rows = await db.query.transactions.findMany({
            where: and(...conditions),
            with: { category: true, account: true },
            orderBy: [desc(transactions.date)],
            limit,
          });

          return rows.map((t) => ({
            description: t.description,
            amount: parseFloat(String(t.amount)),
            type: t.type,
            date: new Date(t.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            category: t.category?.name ?? "Uncategorized",
            account: t.account?.name,
            currency: (t.account as { currency?: string })?.currency ?? "USD",
          }));
        },
      }),

      getSpendingSummary: tool({
        description: "Get total income and expenses for a specific month",
        inputSchema: z.object({
          month: z.number().min(1).max(12).describe("Month number 1–12"),
          year: z.number().describe("Year, e.g. 2026"),
        }),
        execute: async ({ month, year }) => {
          const start = new Date(year, month - 1, 1);
          const end = new Date(year, month, 0, 23, 59, 59, 999);

          const incomeRows = await db
            .select({ currency: accounts.currency, total: sum(transactions.amount) })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(
                eq(transactions.userId, userId!),
                eq(transactions.type, "income"),
                gte(transactions.date, start),
                lte(transactions.date, end)
              )
            )
            .groupBy(accounts.currency);

          const expenseRows = await db
            .select({ currency: accounts.currency, total: sum(transactions.amount) })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(
                eq(transactions.userId, userId!),
                eq(transactions.type, "expense"),
                gte(transactions.date, start),
                lte(transactions.date, end)
              )
            )
            .groupBy(accounts.currency);

          const income: Record<string, number> = {};
          for (const r of incomeRows)
            income[r.currency] = parseFloat(String(r.total || 0));

          const expenses: Record<string, number> = {};
          for (const r of expenseRows)
            expenses[r.currency] = parseFloat(String(r.total || 0));

          return { month, year, income, expenses };
        },
      }),

      getBudgetStatus: tool({
        description:
          "Get the user's budgets and how much has been spent against each",
        inputSchema: z.object({
          month: z.number().min(1).max(12).describe("Month number 1–12"),
          year: z.number().describe("Year, e.g. 2026"),
        }),
        execute: async ({ month, year }) => {
          const start = new Date(year, month - 1, 1);
          const end = new Date(year, month, 0, 23, 59, 59, 999);

          const budgetRows = await db.query.budgets.findMany({
            where: and(
              eq(budgets.userId, userId!),
              eq(budgets.month, month),
              eq(budgets.year, year)
            ),
            with: { category: true },
          });

          return Promise.all(
            budgetRows.map(async (b) => {
              const [{ total }] = await db
                .select({ total: sum(transactions.amount) })
                .from(transactions)
                .where(
                  and(
                    eq(transactions.userId, userId!),
                    eq(transactions.categoryId, b.categoryId),
                    eq(transactions.type, "expense"),
                    gte(transactions.date, start),
                    lte(transactions.date, end)
                  )
                );
              const limit = parseFloat(String(b.amount));
              const spent = parseFloat(String(total || 0));
              return {
                category: b.category.name,
                limit,
                spent,
                remaining: limit - spent,
                overBudget: spent > limit,
              };
            })
          );
        },
      }),

      getCategoryBreakdown: tool({
        description: "Get expense spending broken down by category for a date range",
        inputSchema: z.object({
          fromDate: z.string().describe("Start date ISO format e.g. 2026-03-01"),
          toDate: z.string().describe("End date ISO format e.g. 2026-03-31"),
        }),
        execute: async ({ fromDate, toDate }) => {
          const rows = await db.query.transactions.findMany({
            where: and(
              eq(transactions.userId, userId!),
              eq(transactions.type, "expense"),
              gte(transactions.date, new Date(fromDate)),
              lte(transactions.date, new Date(toDate))
            ),
            with: { category: true, account: true },
          });

          const catMap: Record<
            string,
            { total: number; count: number; currency: string }
          > = {};
          for (const t of rows) {
            const name = t.category?.name ?? "Uncategorized";
            const currency =
              (t.account as { currency?: string })?.currency ?? "USD";
            if (!catMap[name]) catMap[name] = { total: 0, count: 0, currency };
            catMap[name].total += parseFloat(String(t.amount));
            catMap[name].count++;
          }

          return Object.entries(catMap)
            .map(([category, { total, count, currency }]) => ({
              category,
              total,
              count,
              currency,
            }))
            .sort((a, b) => b.total - a.total);
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
