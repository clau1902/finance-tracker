import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";

/** Returns the authenticated session or a 401 response. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, userId: parseInt(session.user.id), error: null };
}

/** Returns a 429 response if the rate limit is exceeded, otherwise null. */
export function applyRateLimit(key: string, limit = 60) {
  const result = checkRateLimit(key, limit);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  return null;
}

/** Validates the Origin header on mutating requests to prevent CSRF.
 *  Skipped in development for convenience. */
export function validateOrigin(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
