import { prisma } from "@/lib/prisma";

const demoPlayers = [
  { email: "orion@example.com", name: "Orion Vale", rating: 2310, wins: 184, losses: 41, draws: 22 },
  { email: "lyra@example.com", name: "Lyra Crown", rating: 2240, wins: 162, losses: 38, draws: 19 },
  { email: "mavrik@example.com", name: "Mavrik Stone", rating: 2175, wins: 149, losses: 35, draws: 17 },
  { email: "selene@example.com", name: "Selene Noir", rating: 2110, wins: 131, losses: 28, draws: 25 },
  { email: "cassian@example.com", name: "Cassian Holt", rating: 2055, wins: 126, losses: 33, draws: 20 },
  { email: "ada@example.com", name: "Ada Mercer", rating: 1985, wins: 117, losses: 29, draws: 21 },
  { email: "viktor@example.com", name: "Viktor Rune", rating: 1910, wins: 103, losses: 27, draws: 18 },
  { email: "noa@example.com", name: "Noa Voss", rating: 1840, wins: 96, losses: 31, draws: 16 },
  { email: "elara@example.com", name: "Elara Finch", rating: 1775, wins: 88, losses: 24, draws: 15 },
];

export async function ensureDemoPlayers() {
  const existing = await prisma.user.count({
    where: { email: { in: demoPlayers.map((p) => p.email) } },
  });

  if (existing === demoPlayers.length) return;

  for (const player of demoPlayers) {
    await prisma.user.upsert({
      where: { email: player.email },
      update: {
        name: player.name,
        rating: player.rating,
        gamesPlayed: player.wins + player.losses + player.draws,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        isGuest: false,
      },
      create: {
        email: player.email,
        name: player.name,
        rating: player.rating,
        rd: 200,
        volatility: 0.06,
        gamesPlayed: player.wins + player.losses + player.draws,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
      },
    });
  }
}
