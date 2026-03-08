import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, applyRateLimit, validateOrigin } from "@/lib/api";
import { categorySchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`categories-get:${ip}`);
  if (rl) return rl;

  try {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId!));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`categories-post:${userId}:${ip}`, 20);
  if (rl) return rl;

  try {
    const body = await req.json();
    const result = categorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, type, color, icon } = result.data;

    // Prevent duplicate names per user
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.userId, userId!), eq(categories.name, name)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
    }

    const [row] = await db
      .insert(categories)
      .values({ userId: userId!, name, type, color, icon: icon ?? "tag" })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
