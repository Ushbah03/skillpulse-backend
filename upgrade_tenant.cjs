const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { name: { contains: 'apex', mode: 'insensitive' } }
  });
  
  if (!tenant) {
    console.log('ApexTech tenant not found!');
    return;
  }
  
  const updatedTenant = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { plan: 'PRO' }
  });

  console.log(`Successfully upgraded ${updatedTenant.name} to ${updatedTenant.plan} plan!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
