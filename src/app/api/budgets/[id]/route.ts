import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, applyRateLimit, validateOrigin } from "@/lib/api";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`budgets-delete:${userId}:${ip}`, 30);
  if (rl) return rl;

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId!)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
