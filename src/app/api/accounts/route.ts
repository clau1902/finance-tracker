
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth, applyRateLimit, validateOrigin } from "@/lib/api";
import { accountSchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`accounts-get:${ip}`);
  if (rl) return rl;

  try {
    const rows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId!));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`accounts-post:${userId}:${ip}`, 10);
  if (rl) return rl;

  try {
    const body = await req.json();
    const result = accountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, type, balance, color } = result.data;
    const [account] = await db
      .insert(accounts)
      .values({
        userId: userId!,
        name,
        type,
        balance: String(balance),
        color: color ?? "#0d9488",
      })
      .returning();

    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
