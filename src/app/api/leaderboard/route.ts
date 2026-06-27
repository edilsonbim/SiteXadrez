import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const top = await prisma.user.findMany({
    orderBy: [{ rating: "desc" }],
    take: 25,
    select: { id: true, name: true, image: true, rating: true, gamesPlayed: true, wins: true, losses: true, draws: true },
  });
  return NextResponse.json({ players: top });
}
