// Edge-compatible auth config — no Node.js-only imports (no bcryptjs, no pg)
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id ?? "";
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [], // populated in auth.ts for the Node.js runtime
};
