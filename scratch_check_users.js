import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { tenant: true, department: true }
  });
  console.log('Total Users count:', users.length);
  users.forEach(u => {
    console.log(`User: ${u.id} | Email: ${u.email} | Role: ${u.role} | TenantId: ${u.tenantId} | TenantName: ${u.tenant?.name}`);
  });
}

main().finally(() => prisma.$disconnect());
