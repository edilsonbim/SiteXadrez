import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { finalizeRating } from "@/server/games";

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const out = await finalizeRating(ctx.params.id);
  if (!out) return NextResponse.json({ error: "not_finished" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
