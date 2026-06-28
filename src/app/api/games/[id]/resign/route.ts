import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { resignGame } from "@/server/games";

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;
  const result = await resignGame({ gameId: ctx.params.id, userId });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, game: result.game });
}
