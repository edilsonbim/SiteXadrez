import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { enqueue, tryMatch } from "@/lib/matchmaking/queue";
import { createPvpGameFor } from "@/server/games";

const Body = z.object({ initialTime: z.number().int().min(60).max(7200).default(600), increment: z.number().int().min(0).max(60).default(0) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const me = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const entry = { userId: me.id, rating: me.rating, joinedAt: Date.now() };
  const opp = tryMatch(entry);
  if (opp) {
    const game = await createPvpGameFor({
      whiteId: me.rating >= opp.rating ? me.id : opp.userId,
      blackId: me.rating >= opp.rating ? opp.userId : me.id,
      initialTime: parsed.data.initialTime,
      increment: parsed.data.increment,
    });
    return NextResponse.json({ matched: true, gameId: game.id });
  }
  enqueue(entry);
  return NextResponse.json({ matched: false, queued: true });
}
