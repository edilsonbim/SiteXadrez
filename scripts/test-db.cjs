const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.$queryRaw`SELECT 1`.then(r => { console.log("OK", r); p.$disconnect(); }).catch(e => { console.error("ERR", e.message); p.$disconnect(); process.exit(1); });
