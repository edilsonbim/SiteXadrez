import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { playMove } from "@/server/games";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const uci = typeof body?.uci === "string" ? body.uci : "";
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const userId = (session?.user as any)?.id ?? null;
  const result = await playMove({
    gameId: ctx.params.id,
    userId,
    side: "w",
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
