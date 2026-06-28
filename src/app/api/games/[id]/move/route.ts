import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { playMove } from "@/server/games";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const uci = typeof body?.uci === "string" ? body.uci : "";
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const userId = (session?.user as any)?.id ?? null;
  const game = await prisma.game.findUnique({ where: { id: ctx.params.id }, select: { mode: true, whiteId: true, blackId: true } });
  if (!game) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const side = game.whiteId === userId ? "w" : game.blackId === userId ? "b" : "w";
  const result = await playMove({
    gameId: ctx.params.id,
    userId,
    side,
    uci,
  });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({
    fen: result.game!.fen,
    pgn: result.game!.pgn,
    ply: result.game!.moveCount,
    result: result.result,
    move: result.move,
  });
}
