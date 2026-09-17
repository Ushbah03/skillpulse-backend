import prisma from './src/config/db.js';

async function verifyDepartmentsInDb() {
  const hrUser = await prisma.user.findFirst({
    where: { email: 'hr@enterprise.com' },
    include: { tenant: true }
  });

  if (!hrUser) {
    console.log("HR User not found");
    return;
  }

  console.log("Logged in HR User:", hrUser.email);
  console.log("Tenant:", hrUser.tenant?.name, "ID:", hrUser.tenantId);

  const departments = await prisma.department.findMany({
    where: { tenantId: hrUser.tenantId },
    include: {
      members: {
        include: {
          skills: { include: { skill: true } }
        }
      }
    }
  });

  console.log(`\nFound ${departments.length} departments in DB for Tenant "${hrUser.tenant?.name}":`);
  departments.forEach(d => {
    let totalSkills = 0;
    let sumProf = 0;
    d.members.forEach(m => {
      m.skills.forEach(s => {
        totalSkills++;
        sumProf += s.proficiencyLevel;
      });
    });
    const avgProf = totalSkills > 0 ? (sumProf / totalSkills).toFixed(1) : 3.4;
    const scorePct = Math.round(avgProf * 20);
    console.log(`- Department DB Name: "${d.name}" | ID: ${d.id} | Members: ${d.members.length} | AvgProf: ${avgProf} | Score: ${scorePct}%`);
  });

  const allMembers = await prisma.user.findMany({
    where: { tenantId: hrUser.tenantId },
    select: { id: true, firstName: true, lastName: true, role: true, department: { select: { name: true } } }
  });
  console.log(`\nTotal Users in Tenant DB: ${allMembers.length}`);
  allMembers.forEach(m => {
    console.log(`  * Member: ${m.firstName} ${m.lastName} | Role: ${m.role} | Department: ${m.department?.name || 'Unassigned'}`);
  });

  await prisma.$disconnect();
}

verifyDepartmentsInDb();
