import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Expanding SkillPulse AI Database Seed with Multiple Tenants & Users...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // ----------------------------------------------------
  // TENANT 1: Enterprise Corp (Primary)
  // ----------------------------------------------------
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'enterprise-corp' },
    update: {},
    create: {
      name: 'Enterprise Corp',
      slug: 'enterprise-corp',
      domain: 'enterprise.com',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      maxUsers: 1000,
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
      themeSettings: { primaryColor: '#4F46E5', darkMode: true }
    }
  });

  // ----------------------------------------------------
  // TENANT 2: TechDynamics Global (New Tenant)
  // ----------------------------------------------------
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'techdynamics-global' },
    update: {},
    create: {
      name: 'TechDynamics Global',
      slug: 'techdynamics-global',
      domain: 'techdynamics.io',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      maxUsers: 500,
      logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150',
      themeSettings: { primaryColor: '#0EA5E9', darkMode: false }
    }
  });

  // ----------------------------------------------------
  // TENANT 3: NexaLabs Innovation (New Tenant)
  // ----------------------------------------------------
  const tenant3 = await prisma.tenant.upsert({
    where: { slug: 'nexalabs-innovation' },
    update: {},
    create: {
      name: 'NexaLabs Innovation',
      slug: 'nexalabs-innovation',
      domain: 'nexalabs.ai',
      plan: 'PRO',
      status: 'ACTIVE',
      maxUsers: 250,
      logoUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150',
      themeSettings: { primaryColor: '#8B5CF6', darkMode: true }
    }
  });

  console.log(`✅ 3 Tenants created: ${tenant1.name}, ${tenant2.name}, ${tenant3.name}`);

  // ----------------------------------------------------
  // DEPARTMENTS & TEAMS FOR TENANT 1 (Enterprise Corp)
  // ----------------------------------------------------
  const devopsDept1 = await prisma.department.upsert({
    where: { tenantId_name: { tenantId: tenant1.id, name: 'Cloud & Infrastructure' } },
    update: {},
    create: { tenantId: tenant1.id, name: 'Cloud & Infrastructure', code: 'DEVOPS-01', description: 'Cloud infrastructure & SRE' }
  });

  const engDept1 = await prisma.department.upsert({
    where: { tenantId_name: { tenantId: tenant1.id, name: 'Software Engineering' } },
    update: {},
    create: { tenantId: tenant1.id, name: 'Software Engineering', code: 'ENG-01', description: 'Core web apps & backend services' }
  });

  const devopsTeam1 = await prisma.team.upsert({
    where: { tenantId_name: { tenantId: tenant1.id, name: 'Core DevOps & SRE Squad' } },
    update: {},
    create: { tenantId: tenant1.id, departmentId: devopsDept1.id, name: 'Core DevOps & SRE Squad', description: 'Kubernetes & CI/CD pipeline team' }
  });

  const frontendTeam1 = await prisma.team.upsert({
    where: { tenantId_name: { tenantId: tenant1.id, name: 'Frontend Architecture Squad' } },
    update: {},
    create: { tenantId: tenant1.id, departmentId: engDept1.id, name: 'Frontend Architecture Squad', description: 'React & web architecture team' }
  });

  // ----------------------------------------------------
  // DEPARTMENTS & TEAMS FOR TENANT 2 (TechDynamics)
  // ----------------------------------------------------
  const engDept2 = await prisma.department.upsert({
    where: { tenantId_name: { tenantId: tenant2.id, name: 'Product Engineering' } },
    update: {},
    create: { tenantId: tenant2.id, name: 'Product Engineering', code: 'PROD-01', description: 'Fintech & payments product engineering' }
  });

  const team2 = await prisma.team.upsert({
    where: { tenantId_name: { tenantId: tenant2.id, name: 'Fintech Core Squad' } },
    update: {},
    create: { tenantId: tenant2.id, departmentId: engDept2.id, name: 'Fintech Core Squad', description: 'Payment processing microservices' }
  });

  // ----------------------------------------------------
  // DEPARTMENTS & TEAMS FOR TENANT 3 (NexaLabs)
  // ----------------------------------------------------
  const aiDept3 = await prisma.department.upsert({
    where: { tenantId_name: { tenantId: tenant3.id, name: 'AI Research & Engineering' } },
    update: {},
    create: { tenantId: tenant3.id, name: 'AI Research & Engineering', code: 'AIR-01', description: 'Deep learning & LLM fine-tuning' }
  });

  const team3 = await prisma.team.upsert({
    where: { tenantId_name: { tenantId: tenant3.id, name: 'LLM Agentics Lab' } },
    update: {},
    create: { tenantId: tenant3.id, departmentId: aiDept3.id, name: 'LLM Agentics Lab', description: 'Autonomous agent pipelines' }
  });

  // ----------------------------------------------------
  // SEED USERS FOR TENANT 1 (Enterprise Corp)
  // ----------------------------------------------------
  const usersTenant1 = [
    { email: 'superadmin@skillpulse.ai', firstName: 'Platform', lastName: 'Superadmin', role: 'SUPER_ADMIN', jobTitle: 'Global Systems Architect' },
    { email: 'admin@enterprise.com', firstName: 'Marcus', lastName: 'Vance', role: 'COMPANY_ADMIN', jobTitle: 'VP of Enterprise Operations' },
    { email: 'hr@enterprise.com', firstName: 'Sarah', lastName: 'Connor', role: 'HR_MANAGER', jobTitle: 'Chief People & Talent Officer' },
    { email: 'leader@enterprise.com', firstName: 'Alex', lastName: 'Morrison', role: 'TEAM_LEADER', jobTitle: 'Engineering Lead & Technical Manager', dept: devopsDept1.id, team: devopsTeam1.id },
    { email: 'emp@enterprise.com', firstName: 'Jane', lastName: 'Doe', role: 'EMPLOYEE', jobTitle: 'Senior Full Stack Dev', dept: engDept1.id, team: frontendTeam1.id, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { email: 'emily.zhang@enterprise.com', firstName: 'Emily', lastName: 'Zhang', role: 'EMPLOYEE', jobTitle: 'Senior DevOps Engineer', dept: devopsDept1.id, team: devopsTeam1.id, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { email: 'michael.ross@enterprise.com', firstName: 'Michael', lastName: 'Ross', role: 'EMPLOYEE', jobTitle: 'Full Stack Engineer', dept: engDept1.id, team: frontendTeam1.id, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { email: 'sophia.lane@enterprise.com', firstName: 'Sophia', lastName: 'Lane', role: 'EMPLOYEE', jobTitle: 'AI / Data Engineer', dept: engDept1.id, team: frontendTeam1.id, img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
    { email: 'zainab.sheikh@enterprise.com', firstName: 'Zainab', lastName: 'Sheikh', role: 'EMPLOYEE', jobTitle: 'Senior Frontend Dev', dept: engDept1.id, team: frontendTeam1.id, img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { email: 'arsalan.ahmed@enterprise.com', firstName: 'Arsalan', lastName: 'Ahmed', role: 'EMPLOYEE', jobTitle: 'Backend Architect', dept: engDept1.id, team: frontendTeam1.id, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  for (const u of usersTenant1) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant1.id, email: u.email } },
      update: {},
      create: {
        tenantId: tenant1.id,
        email: u.email,
        passwordHash: defaultPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        jobTitle: u.jobTitle,
        avatarUrl: u.img,
        departmentId: u.dept,
        teamId: u.team,
        status: 'ACTIVE'
      }
    });
  }

  // ----------------------------------------------------
  // SEED USERS FOR TENANT 2 (TechDynamics Global)
  // ----------------------------------------------------
  const usersTenant2 = [
    { email: 'admin@techdynamics.io', firstName: 'Elena', lastName: 'Rostova', role: 'COMPANY_ADMIN', jobTitle: 'Chief Technology Officer' },
    { email: 'hr@techdynamics.io', firstName: 'Robert', lastName: 'Sterling', role: 'HR_MANAGER', jobTitle: 'Head of People Operations' },
    { email: 'leader@techdynamics.io', firstName: 'Carlos', lastName: 'Mendoza', role: 'TEAM_LEADER', jobTitle: 'Lead Payments Architect', dept: engDept2.id, team: team2.id },
    { email: 'dev1@techdynamics.io', firstName: 'Tariq', lastName: 'Jameel', role: 'EMPLOYEE', jobTitle: 'Senior Backend Engineer', dept: engDept2.id, team: team2.id, img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
    { email: 'dev2@techdynamics.io', firstName: 'Amanda', lastName: 'White', role: 'EMPLOYEE', jobTitle: 'Security Specialist', dept: engDept2.id, team: team2.id, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }
  ];

  for (const u of usersTenant2) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant2.id, email: u.email } },
      update: {},
      create: {
        tenantId: tenant2.id,
        email: u.email,
        passwordHash: defaultPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        jobTitle: u.jobTitle,
        avatarUrl: u.img,
        departmentId: u.dept,
        teamId: u.team,
        status: 'ACTIVE'
      }
    });
  }

  // ----------------------------------------------------
  // SEED USERS FOR TENANT 3 (NexaLabs Innovation)
  // ----------------------------------------------------
  const usersTenant3 = [
    { email: 'admin@nexalabs.ai', firstName: 'Dr. Evelyn', lastName: 'Vance', role: 'COMPANY_ADMIN', jobTitle: 'Founder & CEO' },
    { email: 'leader@nexalabs.ai', firstName: 'Vikram', lastName: 'Sethi', role: 'TEAM_LEADER', jobTitle: 'AI Research Director', dept: aiDept3.id, team: team3.id },
    { email: 'researcher@nexalabs.ai', firstName: 'Chloe', lastName: 'Bennett', role: 'EMPLOYEE', jobTitle: 'Prompt Engineer & Scientist', dept: aiDept3.id, team: team3.id, img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' }
  ];

  for (const u of usersTenant3) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant3.id, email: u.email } },
      update: {},
      create: {
        tenantId: tenant3.id,
        email: u.email,
        passwordHash: defaultPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        jobTitle: u.jobTitle,
        avatarUrl: u.img,
        departmentId: u.dept,
        teamId: u.team,
        status: 'ACTIVE'
      }
    });
  }

  console.log('✅ Users seeded across all 3 Tenants.');

  // ----------------------------------------------------
  // SKILLS & USER SKILLS FOR TENANT 1
  // ----------------------------------------------------
  const getOrCreateCategory = async (tId, name, description) => {
    let cat = await prisma.skillCategory.findFirst({ where: { tenantId: tId, name } });
    if (!cat) {
      cat = await prisma.skillCategory.create({ data: { tenantId: tId, name, description } });
    }
    return cat;
  };

  const catCloud1 = await getOrCreateCategory(tenant1.id, 'Cloud & Infrastructure', 'Kubernetes & AWS Security');
  const catFront1 = await getOrCreateCategory(tenant1.id, 'Frontend Architecture', 'React & TypeScript');

  let skillK8s = await prisma.skill.findFirst({ where: { tenantId: tenant1.id, name: 'Kubernetes Security' } });
  if (!skillK8s) {
    skillK8s = await prisma.skill.create({
      data: { tenantId: tenant1.id, categoryId: catCloud1.id, name: 'Kubernetes Security', description: 'RBAC, CIS benchmarks, Pod isolation', isGlobal: true }
    });
  }

  let skillReact = await prisma.skill.findFirst({ where: { tenantId: tenant1.id, name: 'React.js Architecture' } });
  if (!skillReact) {
    skillReact = await prisma.skill.create({
      data: { tenantId: tenant1.id, categoryId: catFront1.id, name: 'React.js Architecture', description: 'Virtual DOM, Fiber, custom hooks', isGlobal: true }
    });
  }

  // Assign user skill proficiencies for Tenant 1 users
  console.log('⭐ Seeding UserSkills, Compliance, Performance, SkillGaps, SuccessionPools...');
  
  const hrManager = await prisma.user.findFirst({ where: { tenantId: tenant1.id, role: 'HR_MANAGER' } });
  const teamLeader = await prisma.user.findFirst({ where: { tenantId: tenant1.id, role: 'TEAM_LEADER' } });
  const employees = await prisma.user.findMany({ where: { tenantId: tenant1.id, role: 'EMPLOYEE' } });

  // Clear existing HR records for this tenant to ensure idempotency
  await prisma.complianceRecord.deleteMany({ where: { tenantId: tenant1.id } });
  await prisma.performanceRecord.deleteMany({ where: { user: { tenantId: tenant1.id } } });
  await prisma.successionPool.deleteMany({ where: { tenantId: tenant1.id } });
  await prisma.skillGap.deleteMany({ where: { tenantId: tenant1.id } });
  await prisma.courseSkill.deleteMany({});
  await prisma.userSkill.deleteMany({ where: { user: { tenantId: tenant1.id } } });

  // Create UserSkills
  const userSkillsToCreate = [];
  const proficiencyLevels = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 4.8];
  employees.forEach((emp, index) => {
    const empSkills = [skillK8s, skillReact].filter(Boolean);
    empSkills.forEach((sk, skIdx) => {
      userSkillsToCreate.push({
        userId: emp.id,
        skillId: sk.id,
        proficiencyLevel: proficiencyLevels[(index + skIdx) % proficiencyLevels.length],
        verified: (index + skIdx) % 2 === 0,
        verifiedBy: hrManager ? hrManager.email : 'hr@enterprise.com',
        yearsExperience: (index % 5) + 1.5,
        lastAssessedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * (index % 6))
      });
    });
  });

  for (const us of userSkillsToCreate) {
    await prisma.userSkill.create({ data: us });
  }

  // Create CourseSkills
  const courses = await prisma.course.findMany();
  for (const c of courses) {
    const courseTitle = c.title.toLowerCase();
    let matchedSkill = null;
    if (courseTitle.includes('k8s') || courseTitle.includes('security')) matchedSkill = skillK8s;
    else if (courseTitle.includes('react')) matchedSkill = skillReact;

    if (matchedSkill) {
      await prisma.courseSkill.upsert({
        where: { courseId_skillId: { courseId: c.id, skillId: matchedSkill.id } },
        update: {},
        create: {
          courseId: c.id,
          skillId: matchedSkill.id,
          targetProficiency: 4.0
        }
      });
    }
  }

  // Create SkillGaps
  const k8sCourse = courses.find(c => c.title.includes('K8s'));
  const reactCourse = courses.find(c => c.title.includes('React'));
  const gapSpecs = [
    { userIdx: 0, skill: skillK8s, req: 4.5, cur: 2.0, sev: 'CRITICAL', course: k8sCourse },
    { userIdx: 1, skill: skillReact, req: 4.0, cur: 1.5, sev: 'CRITICAL', course: reactCourse },
    { userIdx: 2, skill: skillK8s, req: 4.5, cur: 3.0, sev: 'MEDIUM', course: k8sCourse },
    { userIdx: 3, skill: skillReact, req: 4.5, cur: 2.5, sev: 'MEDIUM', course: reactCourse },
  ];

  for (const spec of gapSpecs) {
    if (employees[spec.userIdx] && spec.skill) {
      await prisma.skillGap.create({
        data: {
          tenantId: tenant1.id,
          userId: employees[spec.userIdx].id,
          skillId: spec.skill.id,
          requiredLevel: spec.req,
          currentLevel: spec.cur,
          severity: spec.sev,
          assignedCourseId: spec.course ? spec.course.id : null
        }
      });
    }
  }

  // Create SuccessionPools
  const successionSpecs = [
    { userIdx: 0, role: 'CTO Target', dept: 'Software Engineering', readiness: 'READY_NOW', risk: 'LOW', score: 92.5, notes: 'Highly competent leader with strong architectural vision.' },
    { userIdx: 1, role: 'CTO Target', dept: 'Software Engineering', readiness: 'WITHIN_1_YEAR', risk: 'MEDIUM', score: 85.0, notes: 'Needs executive presence coaching.' },
    { userIdx: 2, role: 'COO Target', dept: 'Cloud & Infrastructure', readiness: 'WITHIN_2_YEARS', risk: 'LOW', score: 81.0, notes: 'Outstanding manager. Focus on scaling global infrastructure next.' },
    { userIdx: 3, role: 'Director of Product', dept: 'Product Design', readiness: 'READY_NOW', risk: 'HIGH', score: 89.0, notes: 'At flight risk due to recruitment interest. Review compensation.' },
  ];

  for (const spec of successionSpecs) {
    if (employees[spec.userIdx]) {
      await prisma.successionPool.create({
        data: {
          tenantId: tenant1.id,
          targetRole: spec.role,
          department: spec.dept,
          candidateId: employees[spec.userIdx].id,
          readiness: spec.readiness,
          flightRisk: spec.risk,
          leadershipScore: spec.score,
          notes: spec.notes
        }
      });
    }
  }

  // Create ComplianceRecords
  const regulations = ['ISO 27001', 'GDPR', 'HIPAA', 'SOC 2', 'OSHA Safety'];
  const statusValues = ['COMPLIANT', 'PENDING', 'EXPIRED', 'NON_COMPLIANT'];
  for (let i = 0; i < 12; i++) {
    const emp = employees[i % employees.length];
    const reg = regulations[i % regulations.length];
    const status = statusValues[i % statusValues.length];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i % 2 === 0 ? 30 : -30) * (i + 1));

    await prisma.complianceRecord.create({
      data: {
        tenantId: tenant1.id,
        userId: emp.id,
        regulationType: reg,
        status,
        dueDate,
        completedDate: status === 'COMPLIANT' ? new Date(dueDate.getTime() - 10 * 24 * 60 * 60 * 1000) : null,
        certificateUrl: status === 'COMPLIANT' ? `https://skillpulse.s3.amazonaws.com/certificates/${emp.id}_${reg.replace(' ', '_')}.pdf` : null
      }
    });
  }

  // Create PerformanceRecords
  for (let i = 0; i < 8; i++) {
    const emp = employees[i % employees.length];
    const evaluator = i % 2 === 0 ? hrManager : teamLeader;
    if (emp && evaluator) {
      await prisma.performanceRecord.create({
        data: {
          userId: emp.id,
          evaluatorId: evaluator.id,
          reviewPeriod: i % 2 === 0 ? 'Q1 2026' : 'Annual 2025',
          performanceRating: 3.5 + (i % 4) * 0.5,
          skillGrowthRating: 3.0 + (i % 5) * 0.5,
          feedback: 'Excellent contribution during the quarter.',
          kpiMetricsJson: { sprintVelocityPct: 90 + (i % 3) * 5 }
        }
      });
    }
  }

  console.log('🎉 Database expanded with multi-tenant data and all HR analytics records!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
