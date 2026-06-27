// Auth.js v5 configuration. Google OAuth + Prisma adapter. New users
// receive the default rating on first sign-in.

import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: { id: string; rating: number } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { rating: true } });
        (session.user as any).id = user.id;
        (session.user as any).rating = fresh?.rating ?? 1200;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Ensure every new account starts with the canonical rating.
      const initial = parseInt(process.env.INITIAL_RATING ?? "1200", 10);
      if (Number.isFinite(initial) && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { rating: initial, rd: 350, volatility: 0.06 },
        });
        await prisma.ratingHistory.create({
          data: {
            userId: user.id,
            rating: initial,
            rd: 350,
            delta: 0,
            reason: "initial",
          },
        });
      }
    },
  },
});
