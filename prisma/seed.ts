import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demo = [
    { email: "orion@example.com", name: "Orion Vale", rating: 2310, wins: 184, losses: 41, draws: 22 },
    { email: "lyra@example.com", name: "Lyra Crown", rating: 2240, wins: 162, losses: 38, draws: 19 },
    { email: "mavrik@example.com", name: "Mavrik Stone", rating: 2175, wins: 149, losses: 35, draws: 17 },
    { email: "selene@example.com", name: "Selene Noir", rating: 2110, wins: 131, losses: 28, draws: 25 },
    { email: "cassian@example.com", name: "Cassian Holt", rating: 2055, wins: 126, losses: 33, draws: 20 },
    { email: "ada@example.com", name: "Ada Mercer", rating: 1985, wins: 117, losses: 29, draws: 21 },
    { email: "viktor@example.com", name: "Viktor Rune", rating: 1910, wins: 103, losses: 27, draws: 18 },
    { email: "noa@example.com", name: "Noa Voss", rating: 1840, wins: 96, losses: 31, draws: 16 },
    { email: "elara@example.com", name: "Elara Finch", rating: 1775, wins: 88, losses: 24, draws: 15 },
    { email: "bruno@example.com", name: "Bruno", rating: 1320, wins: 22, losses: 34, draws: 11 },
    { email: "clara@example.com", name: "Clara", rating: 1620, wins: 48, losses: 18, draws: 14 },
    { email: "diego@example.com", name: "Diego", rating: 1180, wins: 12, losses: 31, draws: 9 },
    { email: "elena@example.com", name: "Elena", rating: 1750, wins: 71, losses: 26, draws: 17 },
  ];
  for (const u of demo) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        rating: u.rating,
        rd: 200,
        volatility: 0.06,
        gamesPlayed: u.wins + u.losses + u.draws,
        wins: u.wins,
        losses: u.losses,
        draws: u.draws,
      },
    });
  }
  console.log(`Seed: ${demo.length} demo users ready.`);
}

main().finally(() => prisma.$disconnect());
