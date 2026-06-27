import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { playAiMove } from "@/server/games";

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await playAiMove({ gameId: ctx.params.id });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({
    fen: result.game!.fen,
    pgn: result.game!.pgn,
    ply: result.game!.moveCount,
    result: result.result,
    move: result.move,
    ai: { depthReached: result.ai!.depthReached, evaluationCp: result.ai!.evaluationCp, timeMs: result.ai!.timeMs },
  });
}
