import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, categories, accounts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validate";
import { applyRateLimit, validateOrigin } from "@/lib/api";

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income" as const, color: "#6aada6", icon: "briefcase" },
  { name: "Freelance", type: "income" as const, color: "#6097b5", icon: "laptop" },
  { name: "Investments", type: "income" as const, color: "#5ea882", icon: "trending-up" },
  { name: "Groceries", type: "expense" as const, color: "#c49540", icon: "shopping-cart" },
  { name: "Rent", type: "expense" as const, color: "#b87272", icon: "home" },
  { name: "Transport", type: "expense" as const, color: "#8b79c0", icon: "car" },
  { name: "Dining Out", type: "expense" as const, color: "#be7096", icon: "utensils" },
  { name: "Entertainment", type: "expense" as const, color: "#c07a55", icon: "film" },
  { name: "Utilities", type: "expense" as const, color: "#7b93a8", icon: "zap" },
  { name: "Healthcare", type: "expense" as const, color: "#5b90bf", icon: "heart-pulse" },
  { name: "Shopping", type: "expense" as const, color: "#a06db5", icon: "shopping-bag" },
  { name: "Subscriptions", type: "expense" as const, color: "#5aa09a", icon: "repeat" },
];

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitError = applyRateLimit(`register:${ip}`, 5); // 5 registrations/min per IP
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ name, email, password: hashed }).returning();

    // Seed default categories and a starter account for new users
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id }))
    );
    await db.insert(accounts).values({
      userId: user.id,
      name: "Main Checking",
      type: "checking",
      balance: "0",
      color: "#0d9488",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
