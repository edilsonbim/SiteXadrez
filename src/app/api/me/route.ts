import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
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
