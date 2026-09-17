const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apex = await prisma.tenant.findFirst({
    where: { name: { contains: 'apex', mode: 'insensitive' } }
  });
  
  if (apex) {
    await prisma.tenant.update({
      where: { id: apex.id },
      data: { plan: 'STARTER', maxUsers: 30 }
    });
    console.log('Apex successfully reverted to STARTER and 30 max users.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
