import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { createPveGame } from "@/server/games";

const Body = z.object({ initialTime: z.number().int().min(60).max(7200).optional(), increment: z.number().int().min(0).max(60).optional() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const game = await createPveGame({
    userId: (session.user as any).id,
    initialTime: parsed.data.initialTime ?? 600,
    increment: parsed.data.increment ?? 0,
  });
  return NextResponse.json({ gameId: game.id });
}
