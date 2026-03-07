import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, validateOrigin } from "@/lib/api";
import { categoryPatchSchema } from "@/lib/validate";

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
    const catId = parseInt(id);
    if (isNaN(catId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, catId), eq(categories.userId, userId!)));
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const result = categoryPatchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(categories)
      .set({
        name: result.data.name ?? existing.name,
        type: result.data.type ?? existing.type,
        color: result.data.color ?? existing.color,
        icon: result.data.icon ?? existing.icon,
      })
      .where(eq(categories.id, catId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
    const catId = parseInt(id);
    if (isNaN(catId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, catId), eq(categories.userId, userId!)));
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Unlink transactions before deleting
    await db
      .update(transactions)
      .set({ categoryId: null })
      .where(and(eq(transactions.userId, userId!), eq(transactions.categoryId, catId)));

    await db.delete(categories).where(eq(categories.id, catId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
