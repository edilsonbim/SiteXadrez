import { prisma } from "@/lib/prisma";

export async function getLeaderboardPlayers(take: number) {
  return prisma.user.findMany({
    where: {
      isGuest: false,
    },
    orderBy: [{ rating: "desc" }, { gamesPlayed: "desc" }, { createdAt: "asc" }],
    take,
    select: {
      id: true,
      name: true,
      image: true,
      rating: true,
      gamesPlayed: true,
      wins: true,
      losses: true,
      draws: true,
    },
  });
}
