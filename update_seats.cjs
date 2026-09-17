const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.updateMany({
    where: { plan: 'STARTER' },
    data: { maxUsers: 30 }
  });
  
  await prisma.tenant.updateMany({
    where: { plan: 'PRO' },
    data: { maxUsers: 250 }
  });
  
  await prisma.tenant.updateMany({
    where: { plan: 'ENTERPRISE' },
    data: { maxUsers: 1000 }
  });

  console.log('✅ Tenant seat limits updated successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
