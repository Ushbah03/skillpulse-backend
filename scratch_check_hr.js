import prisma from './src/config/db.js';

async function checkHrTenants() {
  const hrUsers = await prisma.user.findMany({
    where: { role: 'HR_MANAGER' },
    include: { tenant: true }
  });

  console.log("HR Users count:", hrUsers.length);
  for (const hr of hrUsers) {
    const memberCount = await prisma.user.count({
      where: { tenantId: hr.tenantId }
    });
    console.log(`HR: ${hr.firstName} ${hr.lastName} (${hr.email}) | TenantId: ${hr.tenantId} | TenantName: ${hr.tenant?.name} | Total Members in Tenant: ${memberCount}`);
  }

  const allTenants = await prisma.tenant.findMany({
    include: { _count: { select: { users: true } } }
  });
  console.log("\nAll Tenants:");
  allTenants.forEach(t => console.log(`Tenant: ${t.name} (ID: ${t.id}) | User count: ${t._count.users}`));

  await prisma.$disconnect();
}

checkHrTenants();
