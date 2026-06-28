import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDemoPlayers } from "@/server/demo-players";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDemoPlayers();
    const top = await prisma.user.findMany({
      where: { isGuest: false },
      orderBy: [{ rating: "desc" }],
      take: 25,
      select: { id: true, name: true, image: true, rating: true, gamesPlayed: true, wins: true, losses: true, draws: true },
    });
    return NextResponse.json({ players: top });
  } catch {
    return NextResponse.json({ players: [] });
  }
}
