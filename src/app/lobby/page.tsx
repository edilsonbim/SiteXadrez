import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { LobbyClient } from "./LobbyClient";
import { getActiveGameForUser } from "@/server/games";

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;
  const activeGame = await getActiveGameForUser(userId).catch(() => null);
  return (
    <LobbyClient
      user={{ id: userId, name: session.user.name ?? "Jogador", image: session.user.image ?? null, rating: (session.user as any).rating ?? 1200 }}
      activeGame={activeGame}
    />
  );
}
