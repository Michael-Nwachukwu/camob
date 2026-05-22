import type { NextAuthConfig } from "next-auth";
import { env } from "@/lib/env";

// Edge-safe NextAuth config. Used by middleware (which runs in the Edge
// runtime and can't import `node:crypto`). The full config in `auth.ts`
// adds the Credentials provider, which pulls in scrypt for password
// verification — that file is NOT importable from middleware.
export const authConfig: NextAuthConfig = {
  secret: env.nextAuthSecret,
  // Required when self-hosting behind a reverse proxy (Caddy). Lets NextAuth
  // trust the X-Forwarded-Host header so sign-in/out and callbacks resolve the
  // correct origin. Vercel sets this implicitly; a VPS must opt in.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/sign-in"
  },
  providers: []
};
