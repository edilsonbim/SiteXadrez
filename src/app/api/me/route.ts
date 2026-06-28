import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ user: null });
  const user = await safeUser((session.user as any).id, session.user);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      rating: user.rating,
      rd: user.rd,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
    },
  });
}

async function safeUser(id: string, sessionUser: any) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return user;
  } catch {
    // fall back to session data when production DB is unavailable
  }

  return {
    id,
    name: sessionUser.name ?? null,
    email: sessionUser.email ?? null,
    image: sessionUser.image ?? null,
    rating: sessionUser.rating ?? 1200,
    rd: 350,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  } as any;
}
