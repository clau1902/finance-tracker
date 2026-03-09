// Edge-compatible proxy (renamed from middleware in Next.js 16)
// Uses only the lightweight authConfig — no Node.js-only modules
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/auth");
  const isLanding = pathname === "/";

  // Landing page is public — let everyone through
  if (isLanding) return;

  if (!isAuthed && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  if (isAuthed && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico).*)"],
};
