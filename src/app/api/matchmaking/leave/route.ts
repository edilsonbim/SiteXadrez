import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { dequeue } from "@/lib/matchmaking/queue";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  dequeue((session.user as any).id);
  return NextResponse.json({ ok: true });
}
