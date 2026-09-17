const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apex = await prisma.tenant.findFirst({
    where: { name: { contains: 'apex', mode: 'insensitive' } },
    select: { id: true, name: true, plan: true, maxUsers: true }
  });
  console.log('Apex Status:', apex);
}

main().catch(console.error).finally(() => prisma.$disconnect());
