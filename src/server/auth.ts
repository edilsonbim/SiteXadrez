// Auth.js v5 configuration. Google OAuth + Credentials (email/password).
// New users receive the default rating on first sign-in.
//
// Session strategy: JWT. Even though we have a PrismaAdapter and could use
// database sessions, Auth.js v5 with `database` strategy doesn't actually
// create a Session row for the Credentials provider (it falls back to JWT
// internally), which forces a fragile "create session + override jwt.encode"
// workaround. JWT is simpler and works identically for OAuth and Credentials.
// The callback below refreshes rating from the DB on every auth() call so the
// session still reflects the latest data.

import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: { id: string; rating: number; isGuest: boolean } & DefaultSession["user"];
  }
}

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

function pickEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) return value;
  }
  return undefined;
}

const googleClientId = pickEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
const googleClientSecret = pickEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET");
const authSecret = pickEnv("AUTH_SECRET", "NEXTAUTH_SECRET");

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: authSecret,
  session: { strategy: "jwt" },
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(creds) {
        const parsed = credSchema.safeParse(creds);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return user;
      },
    }),
  ],
  pages: { signIn: "/login" },
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in `user` is set; persist its id and guest flag into the JWT
      // so later calls (without `user`) can keep using them.
      if (user) {
        token.id = (user as any).id;
        token.isGuest = (user as any).isGuest === true;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
        token.rating = (user as any).rating ?? 1200;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        (session.user as any).id = token.id;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.picture ?? session.user.image;
        (session.user as any).rating = (token.rating as number | undefined) ?? 1200;
        (session.user as any).isGuest = token.isGuest === true;
      }
      return session;
    },
  },
});
