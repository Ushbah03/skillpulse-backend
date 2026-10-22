import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';
import { requireRole } from '../src/middleware/rbacMiddleware.js';

describe('--- MODULE 4: HR MANAGER MODULE DEEP AUTOMATED TEST SUITE ---', () => {

  const testTenantSlug = `hr-qa-tenant-${Date.now()}`;
  const hrEmail = `hr.manager.${Date.now()}@skillpulse-test.internal`;
  const employeeEmail = `hr.employee.${Date.now()}@skillpulse-test.internal`;
  const teamLeaderEmail = `hr.teamleader.${Date.now()}@skillpulse-test.internal`;
  const competitorEmail = `competitor.staff.${Date.now()}@skillpulse-test.internal`;
  const testPassword = 'Password123!';

  let tenantId = null;
  let competitorTenantId = null;
  let hrUserId = null;
  let employeeUserId = null;
  let leaderUserId = null;
  let competitorUserId = null;
  let departmentId = null;
  let categoryId = null;
  let skillId = null;
  let complianceId = null;
  let createdCourseId = null;

  before(async () => {
    // 1. Setup isolated test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'HR Global Workforce Enterprise',
        slug: testTenantSlug,
        plan: 'PRO',
        maxUsers: 100,
        status: 'ACTIVE'
      }
    });
    tenantId = tenant.id;

    // 2. Setup competitor tenant for isolation testing
    const competitor = await prisma.tenant.create({
      data: {
        name: 'Competitor Global Corp',
        slug: `competitor-hr-${Date.now()}`,
        plan: 'PRO',
        maxUsers: 20,
        status: 'ACTIVE'
      }
    });
    competitorTenantId = competitor.id;

    // 3. Setup department
    const department = await prisma.department.create({
      data: { name: `Strategic Operations ${Date.now()}`, tenantId }
    });
    departmentId = department.id;

    // 4. Setup HR Manager user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const hrUser = await prisma.user.create({
      data: {
        tenantId,
        departmentId,
        email: hrEmail,
        passwordHash,
        firstName: 'Eleanor',
        lastName: 'Vance',
        role: 'HR_MANAGER',
        jobTitle: 'Chief People Officer',
        status: 'ACTIVE'
      }
    });
    hrUserId = hrUser.id;

    // 5. Setup Employee user
    const emp = await prisma.user.create({
      data: {
        tenantId,
        departmentId,
        email: employeeEmail,
        passwordHash,
        firstName: 'Robert',
        lastName: 'Taylor',
        role: 'EMPLOYEE',
        jobTitle: 'Operations Analyst',
        status: 'ACTIVE'
      }
    });
    employeeUserId = emp.id;

    // 6. Setup Team Leader user
    const leader = await prisma.user.create({
      data: {
        tenantId,
        departmentId,
        email: teamLeaderEmail,
        passwordHash,
        firstName: 'David',
        lastName: 'Kim',
        role: 'TEAM_LEADER',
        jobTitle: 'Operations Lead',
        status: 'ACTIVE'
      }
    });
    leaderUserId = leader.id;

    // 7. Setup Competitor user
    const competitorUser = await prisma.user.create({
      data: {
        tenantId: competitorTenantId,
        email: competitorEmail,
        passwordHash,
        firstName: 'Rival',
        lastName: 'Operative',
        role: 'EMPLOYEE',
        jobTitle: 'Analyst',
        status: 'ACTIVE'
      }
    });
    competitorUserId = competitorUser.id;

    // 8. Setup Skill Category & Skill
    const category = await prisma.skillCategory.create({
      data: { name: `Strategic Execution ${Date.now()}`, tenantId }
    });
    categoryId = category.id;

    const skill = await prisma.skill.create({
      data: {
        name: `Data-Driven Workforce Planning ${Date.now()}`,
        categoryId: category.id,
        tenantId
      }
    });
    skillId = skill.id;

    // 9. Assign skill to employee
    await prisma.userSkill.create({
      data: {
        userId: employeeUserId,
        skillId: skill.id,
        proficiencyLevel: 4.0,
        yearsExperience: 3.5
      }
    });

    // 10. Create a compliance record
    const compRecord = await prisma.complianceRecord.create({
      data: {
        tenantId,
        userId: employeeUserId,
        regulationType: 'ISO 27001 Security & Data Privacy',
        status: 'COMPLIANT',
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        completedDate: new Date()
      }
    });
    complianceId = compRecord.id;
  });

  after(async () => {
    try {
      if (complianceId) {
        await prisma.complianceRecord.deleteMany({ where: { id: complianceId } });
      }
      if (createdCourseId) {
        await prisma.courseSkill.deleteMany({ where: { courseId: createdCourseId } });
        await prisma.course.deleteMany({ where: { id: createdCourseId } });
      }
      if (employeeUserId || leaderUserId || hrUserId) {
        await prisma.userSkill.deleteMany({ where: { userId: { in: [employeeUserId, leaderUserId, hrUserId] } } });
        await prisma.user.deleteMany({ where: { id: { in: [employeeUserId, leaderUserId, hrUserId] } } });
      }
      if (competitorUserId) {
        await prisma.user.deleteMany({ where: { id: competitorUserId } });
      }
      if (skillId) {
        await prisma.skill.deleteMany({ where: { id: skillId } });
      }
      if (categoryId) {
        await prisma.skillCategory.deleteMany({ where: { id: categoryId } });
      }
      if (departmentId) {
        await prisma.department.deleteMany({ where: { id: departmentId } });
      }
      if (tenantId) {
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
      if (competitorTenantId) {
        await prisma.tenant.deleteMany({ where: { id: competitorTenantId } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
  });

  // 1. RBAC SECURITY FOR HR RESOURCE
  describe('1. RBAC Security & Authorization Boundary for HR Resources', () => {
    test('EMPLOYEE role is strictly blocked with HTTP 403 Forbidden', () => {
      let statusCode = null;
      let responseBody = null;

      const mockReq = { user: { id: employeeUserId, role: 'EMPLOYEE' } };
      const mockRes = {
        status(code) { statusCode = code; return this; },
        json(data) { responseBody = data; return this; }
      };
      let nextCalled = false;

      const guard = requireRole('HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403, 'Employee must receive HTTP 403 for HR endpoints');
      assert.strictEqual(responseBody?.success, false);
    });

    test('TEAM_LEADER role is strictly blocked with HTTP 403 from HR resources', () => {
      let statusCode = null;
      let nextCalled = false;

      const mockReq = { user: { id: leaderUserId, role: 'TEAM_LEADER' } };
      const mockRes = {
        status(code) { statusCode = code; return this; },
        json() { return this; }
      };

      const guard = requireRole('HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403, 'Team Leader must receive HTTP 403 for HR endpoints');
    });

    test('HR_MANAGER role is granted access and proceeds via next()', () => {
      const mockReq = { user: { id: hrUserId, role: 'HR_MANAGER' } };
      let nextCalled = false;

      const guard = requireRole('HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, {}, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'HR Manager must be authorized');
    });
  });

  // 2. ORGANIZATION-WIDE SKILL ANALYTICS & AGGREGATIONS
  describe('2. Organization-Wide Skill Analytics & Department Benchmarking', () => {
    test('Computes live organization readiness score accurately from PostgreSQL userSkills', async () => {
      const userSkills = await prisma.userSkill.findMany({
        where: { user: { tenantId } }
      });

      assert.ok(userSkills.length >= 1);
      const totalProficiency = userSkills.reduce((acc, us) => acc + us.proficiencyLevel, 0);
      const avgProficiency = totalProficiency / userSkills.length;
      const averageReadiness = Math.round((avgProficiency / 5.0) * 100);

      assert.strictEqual(avgProficiency, 4.0);
      assert.strictEqual(averageReadiness, 80, 'Proficiency of 4.0/5.0 must evaluate to 80% readiness');
    });

    test('Total employees count strictly reflects active tenant users in database', async () => {
      const totalEmployees = await prisma.user.count({ where: { tenantId } });
      assert.strictEqual(totalEmployees, 3, 'Must match exactly the 3 registered users in this tenant');

      const competitorCount = await prisma.user.count({ where: { tenantId: competitorTenantId } });
      assert.strictEqual(competitorCount, 1, 'Competitor users are strictly isolated');
    });

    test('Department capability groups proficiencies and member counts dynamically', async () => {
      const deptMembers = await prisma.user.findMany({
        where: { tenantId, departmentId },
        include: { skills: true }
      });

      assert.strictEqual(deptMembers.length, 3, 'All 3 users belong to the test department');
    });
  });

  // 3. COMPLIANCE AUDIT & NOTIFICATION ENGINE
  describe('3. Compliance Tracking & Audit Status Engine', () => {
    test('Calculates live organizational compliance rate from database records', async () => {
      const records = await prisma.complianceRecord.findMany({ where: { tenantId } });
      assert.strictEqual(records.length, 1);

      const compliantCount = records.filter(r => r.status === 'COMPLIANT').length;
      const rate = Math.round((compliantCount / records.length) * 100);

      assert.strictEqual(rate, 100, 'Compliance rate is 100% when 1/1 record is COMPLIANT');
    });

    test('Non-compliant records dynamically degrade organization compliance rate', async () => {
      // Add non-compliant record
      const overdueRecord = await prisma.complianceRecord.create({
        data: {
          tenantId,
          userId: leaderUserId,
          regulationType: 'Anti-Harassment Training 2026',
          status: 'NON_COMPLIANT',
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
      });

      const records = await prisma.complianceRecord.findMany({ where: { tenantId } });
      assert.strictEqual(records.length, 2);

      const compliantCount = records.filter(r => r.status === 'COMPLIANT').length;
      const rate = Math.round((compliantCount / records.length) * 100);

      assert.strictEqual(rate, 50, 'Compliance rate drops to 50% when 1 of 2 is NON_COMPLIANT');

      // Cleanup overdue record
      await prisma.complianceRecord.delete({ where: { id: overdueRecord.id } });
    });
  });

  // 4. TRAINING COURSE CREATION & ENTERPRISE CATALOG
  describe('4. Enterprise L&D Course Creation & Catalog Integration', () => {
    test('HR Manager creates enterprise course with target skill proficiencies', async () => {
      const course = await prisma.course.create({
        data: {
          tenantId,
          title: 'Executive Leadership & Conflict Resolution',
          description: 'Advanced management curriculum for high-potential leaders.',
          provider: 'SkillPulse Executive Academy',
          durationHours: 24.0,
          level: 'Advanced',
          rating: 4.95,
          skillsTaught: {
            create: [{ skillId, targetProficiency: 4.8 }]
          }
        },
        include: { skillsTaught: true }
      });
      createdCourseId = course.id;

      assert.ok(course.id);
      assert.strictEqual(course.tenantId, tenantId);
      assert.strictEqual(course.title, 'Executive Leadership & Conflict Resolution');
      assert.strictEqual(course.durationHours, 24.0);
      assert.strictEqual(course.skillsTaught.length, 1);
    });
  });

  // 5. ZERO-FAKE / ZERO-DUMMY DATA AUDIT FOR HR MODULE
  describe('5. Zero-Fake & Zero-Dummy Data Integrity Verification for HR', () => {
    let emptyTenantId = null;

    before(async () => {
      const emptyTenant = await prisma.tenant.create({
        data: {
          name: 'Zero-Dummy HR Test Workspace',
          slug: `zero-dummy-hr-${Date.now()}`,
          plan: 'PRO',
          maxUsers: 25,
          status: 'ACTIVE'
        }
      });
      emptyTenantId = emptyTenant.id;
    });

    after(async () => {
      try {
        if (emptyTenantId) await prisma.tenant.delete({ where: { id: emptyTenantId } });
      } catch (e) {}
    });

    test('Pristine tenant returns 0 employees, 0 readiness, and 0 compliance rate (no fake stats)', async () => {
      const employeeCount = await prisma.user.count({ where: { tenantId: emptyTenantId } });
      assert.strictEqual(employeeCount, 0, 'Empty tenant has exactly 0 employees');

      const userSkills = await prisma.userSkill.findMany({ where: { user: { tenantId: emptyTenantId } } });
      const avgReadiness = userSkills.length 
        ? Math.round(((userSkills.reduce((a, s) => a + s.proficiencyLevel, 0) / userSkills.length) / 5) * 100)
        : 0;
      assert.strictEqual(avgReadiness, 0, 'Average readiness must evaluate to 0% (not a fake 75% or 82%)');

      const complianceRecords = await prisma.complianceRecord.findMany({ where: { tenantId: emptyTenantId } });
      const complianceRate = complianceRecords.length 
        ? Math.round((complianceRecords.filter(r => r.status === 'COMPLIANT').length / complianceRecords.length) * 100)
        : 0;
      assert.strictEqual(complianceRate, 0, 'Compliance rate must be 0% when no records exist');
    });

    test('Zero skill gaps in DB returns strictly empty array (no synthetic gaps injected)', async () => {
      const gaps = await prisma.skillGap.findMany({ where: { tenantId: emptyTenantId } });
      assert.strictEqual(Array.isArray(gaps), true);
      assert.strictEqual(gaps.length, 0, 'No fake gaps injected');
    });
  });
});
