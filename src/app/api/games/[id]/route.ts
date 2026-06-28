import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { finalizeTimeout, getClockState } from "@/server/games";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const game = await prisma.game.findUnique({
    where: { id: ctx.params.id },
    include: {
      white: { select: { id: true, name: true, rating: true, image: true } },
      black: { select: { id: true, name: true, rating: true, image: true } },
      moves: { orderBy: { ply: "asc" } },
    },
  });
  if (!game) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const meId = (session.user as any).id as string;
  if (game.mode === "PVP" && game.whiteId !== meId && game.blackId !== meId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (game.status === "IN_PROGRESS") {
    const clockState = getClockState(game);
    if (clockState.expiredSide) {
      await finalizeTimeout(game.id, clockState.expiredSide);
      const finished = await prisma.game.findUnique({
        where: { id: ctx.params.id },
        include: {
          white: { select: { id: true, name: true, rating: true, image: true } },
          black: { select: { id: true, name: true, rating: true, image: true } },
          moves: { orderBy: { ply: "asc" } },
        },
      });
      return NextResponse.json({
        game: finished
          ? {
              ...finished,
              whiteTime: clockState.whiteTime,
              blackTime: clockState.blackTime,
            }
          : null,
      });
    }
    return NextResponse.json({
      game: {
        ...game,
        whiteTime: clockState.whiteTime,
        blackTime: clockState.blackTime,
      },
    });
  }
  return NextResponse.json({ game });
}
