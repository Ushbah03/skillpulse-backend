import { PrismaClient } from '@prisma/client';

async function testConnection(url, label) {
  console.log(`Testing ${label}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(`SUCCESS [${label}]: Found ${users.length} users:`, users);
  } catch (err) {
    console.error(`FAILED [${label}]:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL environment variable is missing.");
    return;
  }
  await testConnection(url, "Environment DATABASE_URL");
}

main();
