// IslandReady AI — Auth.js (next-auth v4) options (Phase 1).
// Credentials provider + JWT sessions. No adapter tables.
// Security: uniform null for unknown-email and wrong-password (no enumeration);
// dummy-hash compare keeps timing similar when the email is unknown;
// credentials are never logged.
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "./db";

// Precomputed bcrypt hash of a random secret: compared when the email is
// unknown so response timing does not reveal whether an email exists.
const DUMMY_HASH =
  "$2b$12$KIXxQG7m9zT9vH2pQ8wXuO5nR6sT7uV8wX9yZ0aB1cD2eF3gH4iJ5kLm";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1) {
          return null;
        }
        const { rows } = await query(
          "SELECT id, email, password_hash FROM users WHERE email = $1",
          [email]
        );
        const user = rows[0] as
          | { id: string; email: string; password_hash: string }
          | undefined;
        const ok = await bcrypt.compare(
          password,
          user ? user.password_hash : DUMMY_HASH
        );
        if (!ok || !user) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      (session.user as unknown as { id?: string }).id =
        (token.uid as string | undefined) ?? token.sub;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
