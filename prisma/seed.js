const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.trade.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  await prisma.user.createMany({
    data: [
      { username: "attacker", balance: 10000.0 },
      { username: "user1", balance: 20000.0 },
      { username: "user2", balance: 15000.0 },
    ],
  });

  // Create stocks
  await prisma.stock.createMany({
    data: [
      { symbol: "GOOG", name: "Google", price: 1000.0 },
      { symbol: "NVDA", name: "Nvidia", price: 500.0 },
      { symbol: "TSLA", name: "Tesla", price: 800.0 },
      { symbol: "MSFT", name: "Microsoft", price: 250.0 },
      { symbol: "TCS", name: "Tata Consultancy Services", price: 100.0 },
      { symbol: "ITC", name: "ITC Limited", price: 200.0 },
      { symbol: "WIPRO", name: "Wipro Limited", price: 150.0 },
    ],
  });

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
