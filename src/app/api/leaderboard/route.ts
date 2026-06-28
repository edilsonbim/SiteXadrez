import { NextResponse } from "next/server";
import { getLeaderboardPlayers } from "@/server/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const top = await getLeaderboardPlayers(25);
    return NextResponse.json({ players: top });
  } catch {
    return NextResponse.json({ players: [] });
  }
}
