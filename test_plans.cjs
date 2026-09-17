const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  let proTenant = await prisma.tenant.findFirst({ where: { name: 'ProTech Solutions' } });
  if (!proTenant) {
    proTenant = await prisma.tenant.create({
      data: { name: 'ProTech Solutions', slug: 'protech', domain: 'protech.com', plan: 'PRO', status: 'ACTIVE' }
    });
  }
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: proTenant.id, email: 'admin@protech.com' } },
    update: { role: 'COMPANY_ADMIN', status: 'ACTIVE' },
    create: { email: 'admin@protech.com', passwordHash: hashedPassword, firstName: 'Pro', lastName: 'Admin', role: 'COMPANY_ADMIN', tenantId: proTenant.id, status: 'ACTIVE' }
  });
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: proTenant.id, email: 'hr@protech.com' } },
    update: { role: 'HR_MANAGER', status: 'ACTIVE' },
    create: { email: 'hr@protech.com', passwordHash: hashedPassword, firstName: 'Pro', lastName: 'HR', role: 'HR_MANAGER', tenantId: proTenant.id, status: 'ACTIVE' }
  });

  let entTenant = await prisma.tenant.findFirst({ where: { name: 'Enterprise Global' } });
  if (!entTenant) {
    entTenant = await prisma.tenant.create({
      data: { name: 'Enterprise Global', slug: 'entercorp', domain: 'entercorp.com', plan: 'ENTERPRISE', status: 'ACTIVE' }
    });
  }
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: entTenant.id, email: 'admin@entercorp.com' } },
    update: { role: 'COMPANY_ADMIN', status: 'ACTIVE' },
    create: { email: 'admin@entercorp.com', passwordHash: hashedPassword, firstName: 'Enter', lastName: 'Admin', role: 'COMPANY_ADMIN', tenantId: entTenant.id, status: 'ACTIVE' }
  });
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: entTenant.id, email: 'hr@entercorp.com' } },
    update: { role: 'HR_MANAGER', status: 'ACTIVE' },
    create: { email: 'hr@entercorp.com', passwordHash: hashedPassword, firstName: 'Enter', lastName: 'HR', role: 'HR_MANAGER', tenantId: entTenant.id, status: 'ACTIVE' }
  });

  console.log('✅ Pro and Enterprise tenants & users created successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
