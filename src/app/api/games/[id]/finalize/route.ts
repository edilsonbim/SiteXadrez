import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { finalizeRating, finalizeTimeout } from "@/server/games";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const timeoutSide = body?.timeoutSide === "w" || body?.timeoutSide === "b" ? body.timeoutSide : null;
  const out = timeoutSide ? await finalizeTimeout(ctx.params.id, timeoutSide) : await finalizeRating(ctx.params.id);
  if (!out) return NextResponse.json({ error: "not_finished" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
