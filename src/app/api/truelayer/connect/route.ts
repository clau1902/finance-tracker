import { NextRequest, NextResponse } from "next/server";
import { requireAuth, applyRateLimit } from "@/lib/api";
import { buildAuthUrl } from "@/lib/truelayer";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = applyRateLimit(`truelayer-connect:${ip}`, 20);
  if (rl) return rl;

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/truelayer/callback`;

  const url = buildAuthUrl(
    process.env.TRUELAYER_CLIENT_ID!,
    redirectUri
  );

  return NextResponse.json({ url });
}
