import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function retry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`Retry ${i + 1}...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function main() {
  // Warm up connection
  await retry(() => prisma.$queryRaw`SELECT 1`);
  console.log('DB connected!\n');

  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });
  console.log('=== TENANTS ===');
  console.log(JSON.stringify(tenants, null, 2));

  // Focus on Enterprise Corp (primary tenant)
  const t = tenants.find(t => t.slug === 'enterprise-corp');
  if (!t) { console.log('No enterprise-corp tenant!'); return; }

  console.log(`\n=== DATA FOR TENANT: ${t.name} ===`);
  
  const counts = {
    users: await prisma.user.count({ where: { tenantId: t.id } }),
    departments: await prisma.department.count({ where: { tenantId: t.id } }),
    teams: await prisma.team.count({ where: { tenantId: t.id } }),
    skillGaps: await prisma.skillGap.count({ where: { tenantId: t.id } }),
    successionPools: await prisma.successionPool.count({ where: { tenantId: t.id } }),
    complianceRecords: await prisma.complianceRecord.count({ where: { tenantId: t.id } }),
    courses: await prisma.course.count({ where: { OR: [{ tenantId: t.id }, { tenantId: null }] } }),
    enrollments: await prisma.learningEnrollment.count({ where: { tenantId: t.id } }),
    performanceRecords: await prisma.performanceRecord.count({ where: { user: { tenantId: t.id } } }),
  };
  
  console.log('\nTable Counts:');
  Object.entries(counts).forEach(([k, v]) => {
    const status = v === 0 ? 'EMPTY' : `${v} records`;
    console.log(`  ${k}: ${status}`);
  });

  // Count user skills
  const userSkillCount = await prisma.userSkill.count({ where: { user: { tenantId: t.id } } });
  console.log(`  userSkills: ${userSkillCount === 0 ? 'EMPTY' : `${userSkillCount} records`}`);

  // Users breakdown
  const users = await prisma.user.findMany({ 
    where: { tenantId: t.id }, 
    select: { id: true, email: true, firstName: true, lastName: true, role: true, departmentId: true, teamId: true, jobTitle: true }
  });
  console.log(`\nUsers by role:`);
  const roleGroups = {};
  users.forEach(u => { roleGroups[u.role] = (roleGroups[u.role] || []).concat(u); });
  Object.entries(roleGroups).forEach(([role, members]) => {
    console.log(`  ${role} (${members.length}):`);
    members.forEach(m => console.log(`    - ${m.firstName} ${m.lastName} <${m.email}> dept=${m.departmentId ? 'yes' : 'no'}`));
  });

  // Departments
  const depts = await prisma.department.findMany({ where: { tenantId: t.id }, select: { id: true, name: true } });
  console.log(`\nDepartments:`);
  depts.forEach(d => console.log(`  - ${d.name} (${d.id})`));

  // Skill categories
  const cats = await prisma.skillCategory.findMany({
    where: { OR: [{ tenantId: t.id }, { tenantId: null }] },
    include: { skills: { select: { id: true, name: true } } }
  });
  console.log(`\nSkill Categories (${cats.length}):`);
  cats.forEach(c => console.log(`  - ${c.name}: [${c.skills.map(s => s.name).join(', ')}]`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
