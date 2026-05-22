import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function passwordMatches(password: string): boolean {
  if (env.adminPasswordHash) {
    return verifyPassword(password, env.adminPasswordHash);
  }

  // Plaintext fallback exists only for local dev. assertProductionEnv()
  // refuses to boot in production without ADMIN_PASSWORD_HASH.
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return password === env.adminPassword;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const emailMatches = email.toLowerCase() === env.adminEmail.toLowerCase();
        const pwMatches = passwordMatches(password);

        if (!emailMatches || !pwMatches) {
          return null;
        }

        return {
          id: "camob-admin",
          name: "Camob Admin",
          email
        };
      }
    })
  ]
});
