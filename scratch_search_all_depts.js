import prisma from './src/config/db.js';

async function searchAllDepts() {
  const tenants = await prisma.tenant.findMany({
    include: {
      departments: true,
      users: { select: { id: true, email: true, role: true } }
    }
  });

  console.log("All Tenants and their DB Departments:");
  for (const t of tenants) {
    console.log(`\nTenant: "${t.name}" (ID: ${t.id}) | Total Users: ${t.users.length}`);
    if (t.departments.length === 0) {
      console.log("  (No Department rows in DB)");
    } else {
      t.departments.forEach(d => {
        console.log(`  - DB Dept: "${d.name}" (ID: ${d.id})`);
      });
    }
  }

  await prisma.$disconnect();
}

searchAllDepts();
