import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { GameClient } from "./GameClient";

export default async function GamePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <GameClient gameId={params.id} me={{ id: (session.user as any).id, name: session.user.name ?? "Voce", image: session.user.image ?? null }} />;
}
