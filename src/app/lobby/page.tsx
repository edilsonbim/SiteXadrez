import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { LobbyClient } from "./LobbyClient";

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <LobbyClient user={{ id: (session.user as any).id, name: session.user.name ?? "Jogador", image: session.user.image ?? null, rating: (session.user as any).rating ?? 1200 }} />;
}
