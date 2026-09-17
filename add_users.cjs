const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { name: { contains: 'apex', mode: 'insensitive' } }
  });
  
  if (!tenant) {
    console.log('ApexTech tenant not found!');
    return;
  }
  
  console.log('Found Tenant:', tenant.name, 'Plan:', tenant.plan);
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@apextech.com' } },
    update: {},
    create: { email: 'admin@apextech.com', passwordHash: hashedPassword, firstName: 'Apex', lastName: 'Admin', role: 'COMPANY_ADMIN', tenantId: tenant.id, status: 'ACTIVE' }
  });
  
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'hr@apextech.com' } },
    update: {},
    create: { email: 'hr@apextech.com', passwordHash: hashedPassword, firstName: 'Apex', lastName: 'HR', role: 'HR_MANAGER', tenantId: tenant.id, status: 'ACTIVE' }
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'tl@apextech.com' } },
    update: {},
    create: { email: 'tl@apextech.com', passwordHash: hashedPassword, firstName: 'Apex', lastName: 'Lead', role: 'TEAM_LEADER', tenantId: tenant.id, status: 'ACTIVE' }
  });

  console.log('Users created successfully:');
  console.log('1. admin@apextech.com (COMPANY_ADMIN)');
  console.log('2. hr@apextech.com (HR_MANAGER)');
  console.log('3. tl@apextech.com (TEAM_LEADER)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
