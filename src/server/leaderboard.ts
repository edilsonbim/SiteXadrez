import { prisma } from "@/lib/prisma";

const DEMO_PLAYER_EMAILS = [
  "orion@example.com",
  "lyra@example.com",
  "mavrik@example.com",
  "selene@example.com",
  "cassian@example.com",
  "ada@example.com",
  "viktor@example.com",
  "noa@example.com",
  "elara@example.com",
];

export async function getLeaderboardPlayers(take: number) {
  return prisma.user.findMany({
    where: {
      isGuest: false,
      email: { notIn: DEMO_PLAYER_EMAILS },
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
