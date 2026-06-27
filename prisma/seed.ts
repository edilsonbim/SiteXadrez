import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demo = [
    { email: "alice@example.com", name: "Alice", rating: 1480 },
    { email: "bruno@example.com", name: "Bruno", rating: 1320 },
    { email: "clara@example.com", name: "Clara", rating: 1620 },
    { email: "diego@example.com", name: "Diego", rating: 1180 },
    { email: "elena@example.com", name: "Elena", rating: 1750 },
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
      },
    });
  }
  console.log("Seed: 5 demo users ready.");
}

main().finally(() => prisma.$disconnect());
