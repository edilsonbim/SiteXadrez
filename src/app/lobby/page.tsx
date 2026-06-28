import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { LobbyClient } from "./LobbyClient";
import { prisma } from "@/lib/prisma";

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;
  const activeGame = await prisma.game.findFirst({
    where: {
      status: "IN_PROGRESS",
      OR: [{ whiteId: userId }, { blackId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, mode: true },
  }).catch(() => null);
  return (
    <LobbyClient
      user={{ id: userId, name: session.user.name ?? "Jogador", image: session.user.image ?? null, rating: (session.user as any).rating ?? 1200 }}
      activeGame={activeGame}
    />
  );
}
