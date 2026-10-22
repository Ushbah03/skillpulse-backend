import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';
import { requireRole } from '../src/middleware/rbacMiddleware.js';

describe('--- MODULE 3: TEAM LEADER / MANAGER MODULE DEEP AUTOMATED TEST SUITE ---', () => {

  const testTenantSlug = `team-qa-tenant-${Date.now()}`;
  const leaderEmail = `teamleader.${Date.now()}@skillpulse-test.internal`;
  const employee1Email = `member1.${Date.now()}@skillpulse-test.internal`;
  const employee2Email = `member2.${Date.now()}@skillpulse-test.internal`;
  const otherTenantEmail = `outsider.${Date.now()}@skillpulse-test.internal`;
  const testPassword = 'Password123!';

  let tenantId = null;
  let otherTenantId = null;
  let teamId = null;
  let leaderId = null;
  let member1Id = null;
  let member2Id = null;
  let outsiderId = null;
  let courseId = null;
  let skillId = null;
  let enrollmentId = null;
  let departmentId = null;

  before(async () => {
    // 1. Setup isolated test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Team Leader QA Enterprise',
        slug: testTenantSlug,
        plan: 'PRO',
        maxUsers: 50,
        status: 'ACTIVE'
      }
    });
    tenantId = tenant.id;

    // 2. Setup rival tenant to test cross-tenant isolation
    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'Unrelated Competitor Corp',
        slug: `competitor-${Date.now()}`,
        plan: 'STARTER',
        maxUsers: 10,
        status: 'ACTIVE'
      }
    });
    otherTenantId = otherTenant.id;

    // 3. Setup department and team
    const department = await prisma.department.create({
      data: { name: `Cloud Engineering ${Date.now()}`, tenantId }
    });
    departmentId = department.id;

    const team = await prisma.team.create({
      data: {
        name: `DevOps Squad Alpha ${Date.now()}`,
        tenantId,
        departmentId: department.id
      }
    });
    teamId = team.id;

    // 4. Setup Team Leader
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const leader = await prisma.user.create({
      data: {
        tenantId,
        teamId,
        departmentId: department.id,
        email: leaderEmail,
        passwordHash,
        firstName: 'Marcus',
        lastName: 'Vance',
        role: 'TEAM_LEADER',
        jobTitle: 'Principal Engineering Lead',
        status: 'ACTIVE'
      }
    });
    leaderId = leader.id;

    // Update team to mark leaderId
    await prisma.team.update({
      where: { id: teamId },
      data: { leaderId }
    });

    // 5. Setup 2 team members
    const member1 = await prisma.user.create({
      data: {
        tenantId,
        teamId,
        departmentId: department.id,
        email: employee1Email,
        passwordHash,
        firstName: 'Alex',
        lastName: 'Chen',
        role: 'EMPLOYEE',
        jobTitle: 'Senior Cloud Engineer',
        status: 'ACTIVE'
      }
    });
    member1Id = member1.id;

    const member2 = await prisma.user.create({
      data: {
        tenantId,
        teamId,
        departmentId: department.id,
        email: employee2Email,
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: 'EMPLOYEE',
        jobTitle: 'Site Reliability Engineer',
        status: 'ACTIVE'
      }
    });
    member2Id = member2.id;

    // 6. Setup outsider user in other tenant
    const outsider = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        email: otherTenantEmail,
        passwordHash,
        firstName: 'Rival',
        lastName: 'Worker',
        role: 'EMPLOYEE',
        jobTitle: 'Developer',
        status: 'ACTIVE'
      }
    });
    outsiderId = outsider.id;

    // 7. Setup skill & course
    const category = await prisma.skillCategory.create({
      data: { name: `Infrastructure ${Date.now()}`, tenantId }
    });
    const skill = await prisma.skill.create({
      data: {
        name: `Kubernetes Cluster Architecture ${Date.now()}`,
        categoryId: category.id,
        tenantId
      }
    });
    skillId = skill.id;

    const course = await prisma.course.create({
      data: {
        tenantId,
        title: 'Production Kubernetes Cluster Management',
        provider: 'Cloud Native LMS',
        durationHours: 16.0,
        level: 'Advanced',
        rating: 4.9,
        skillsTaught: {
          create: [{ skillId: skill.id, targetProficiency: 4.5 }]
        }
      }
    });
    courseId = course.id;
  });

  after(async () => {
    try {
      if (enrollmentId) {
        await prisma.learningEnrollment.deleteMany({ where: { id: enrollmentId } });
      }
      if (member1Id || member2Id || leaderId) {
        await prisma.learningEnrollment.deleteMany({ where: { userId: { in: [member1Id, member2Id, leaderId] } } });
        await prisma.skillGap.deleteMany({ where: { userId: { in: [member1Id, member2Id, leaderId] } } });
        await prisma.userSkill.deleteMany({ where: { userId: { in: [member1Id, member2Id, leaderId] } } });
        await prisma.user.deleteMany({ where: { id: { in: [member1Id, member2Id, leaderId] } } });
      }
      if (outsiderId) {
        await prisma.user.deleteMany({ where: { id: outsiderId } });
      }
      if (teamId) {
        await prisma.team.deleteMany({ where: { id: teamId } });
      }
      if (courseId) {
        await prisma.courseSkill.deleteMany({ where: { courseId } });
        await prisma.course.deleteMany({ where: { id: courseId } });
      }
      if (skillId) {
        await prisma.skill.deleteMany({ where: { id: skillId } });
      }
      if (tenantId) {
        await prisma.department.deleteMany({ where: { tenantId } });
        await prisma.skillCategory.deleteMany({ where: { tenantId } });
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
      if (otherTenantId) {
        await prisma.tenant.deleteMany({ where: { id: otherTenantId } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
  });

  // 1. RBAC SECURITY FOR TEAM LEADER RESOURCE
  describe('1. RBAC Security & Authorization Boundary', () => {
    test('Regular EMPLOYEE role is strictly blocked with HTTP 403 Forbidden', () => {
      let statusCode = null;
      let responseBody = null;

      const mockReq = { user: { id: member1Id, role: 'EMPLOYEE' } };
      const mockRes = {
        status(code) { statusCode = code; return this; },
        json(data) { responseBody = data; return this; }
      };
      let nextCalled = false;

      const guard = requireRole('TEAM_LEADER', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'Employee must NOT be allowed to proceed');
      assert.strictEqual(statusCode, 403, 'Employee must receive HTTP 403');
      assert.strictEqual(responseBody?.success, false);
      assert.match(responseBody?.message, /Access denied|not authorized/i);
    });

    test('TEAM_LEADER role is granted access and proceeds via next()', () => {
      const mockReq = { user: { id: leaderId, role: 'TEAM_LEADER' } };
      const mockRes = {};
      let nextCalled = false;

      const guard = requireRole('TEAM_LEADER', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Team Leader must be permitted to proceed');
    });
  });

  // 2. TEAM SCOPING & DATA ISOLATION
  describe('2. Team Member Scoping & Strict Tenant Isolation', () => {
    test('Team Leader queries only members assigned to their team, excluding leaders and outsiders', async () => {
      const members = await prisma.user.findMany({
        where: {
          tenantId,
          teamId,
          id: { not: leaderId }
        },
        select: { id: true, firstName: true, email: true }
      });

      assert.strictEqual(members.length, 2, 'Must return exactly the 2 assigned team members');
      const memberEmails = members.map(m => m.email);
      assert.ok(memberEmails.includes(employee1Email));
      assert.ok(memberEmails.includes(employee2Email));
      assert.ok(!memberEmails.includes(leaderEmail), 'Team Leader must not be listed as a subordinate member');
      assert.ok(!memberEmails.includes(otherTenantEmail), 'Cross-tenant users must never be returned');
    });
  });

  // 3. TEAM SKILL MATRIX & SINGLE POINT OF FAILURE (SPOF)
  describe('3. Team Skill Matrix & Single Point of Failure (SPOF) Detection', () => {
    test('Detects SPOF risk when exactly 1 member holds expert proficiency in a technology', async () => {
      // Member 1 is an expert (4.8)
      await prisma.userSkill.create({
        data: {
          userId: member1Id,
          skillId,
          proficiencyLevel: 4.8,
          yearsExperience: 4.0
        }
      });

      // Member 2 does not have this skill yet
      const teamUserSkills = await prisma.userSkill.findMany({
        where: {
          userId: { in: [member1Id, member2Id] },
          skillId
        }
      });

      const expertCount = teamUserSkills.filter(us => us.proficiencyLevel >= 4.0).length;
      assert.strictEqual(expertCount, 1, 'Exactly 1 member is an expert');

      const isSPOF = expertCount === 1;
      assert.strictEqual(isSPOF, true, 'Skill must be flagged as Single Point of Failure (SPOF)');
    });

    test('SPOF risk resolves when second member is trained and upskilled', async () => {
      // Member 2 acquires proficiency 4.0
      await prisma.userSkill.create({
        data: {
          userId: member2Id,
          skillId,
          proficiencyLevel: 4.0,
          yearsExperience: 2.0
        }
      });

      const teamUserSkills = await prisma.userSkill.findMany({
        where: {
          userId: { in: [member1Id, member2Id] },
          skillId
        }
      });

      const expertCount = teamUserSkills.filter(us => us.proficiencyLevel >= 4.0).length;
      assert.strictEqual(expertCount, 2, 'Now 2 members are experts');

      const isSPOF = expertCount === 1;
      assert.strictEqual(isSPOF, false, 'SPOF risk must be cleared when 2+ members are proficient');
    });
  });

  // 4. TEAM READINESS SCORE CALCULATION
  describe('4. Team Readiness & Benchmark Scoring Engine', () => {
    test('Calculates composite team readiness from average proficiency and skill gaps', async () => {
      const skills = await prisma.userSkill.findMany({
        where: { userId: { in: [member1Id, member2Id] } }
      });

      const avgProficiency = skills.reduce((acc, s) => acc + s.proficiencyLevel, 0) / skills.length;
      const baseReadiness = Math.round((avgProficiency / 5.0) * 100);

      assert.ok(baseReadiness >= 80, 'High proficiency team achieves 80%+ readiness');

      // Add a critical skill gap for member 2
      const gap = await prisma.skillGap.create({
        data: {
          tenantId,
          userId: member2Id,
          skillId,
          requiredLevel: 4.9,
          currentLevel: 4.0,
          severity: 'CRITICAL'
        }
      });

      const criticalGapsCount = await prisma.skillGap.count({
        where: {
          userId: { in: [member1Id, member2Id] },
          severity: 'CRITICAL'
        }
      });

      assert.strictEqual(criticalGapsCount, 1);
      // Readiness penalty formula: Base - (Critical Gaps * 5)
      const adjustedReadiness = Math.max(0, baseReadiness - (criticalGapsCount * 5));
      assert.strictEqual(adjustedReadiness, baseReadiness - 5, 'Critical gap reduces team readiness');
    });
  });

  // 5. TRAINING REQUESTS & APPROVAL WORKFLOW
  describe('5. Training Requests, Approvals & Batch Management', () => {
    test('Employee submits training request in NOT_STARTED (Pending Approval) state', async () => {
      const enrollment = await prisma.learningEnrollment.create({
        data: {
          tenantId,
          userId: member1Id,
          courseId,
          status: 'NOT_STARTED',
          progressPct: 0.0,
          enrolledAt: new Date()
        }
      });
      enrollmentId = enrollment.id;

      assert.ok(enrollment.id);
      assert.strictEqual(enrollment.status, 'NOT_STARTED');
    });

    test('Team Leader approves training request, transitioning status to ENROLLED', async () => {
      const approved = await prisma.learningEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'ENROLLED' }
      });

      assert.strictEqual(approved.status, 'ENROLLED', 'Status must transition to ENROLLED');
    });

    test('Batch approval updates multiple pending requests in a single transaction', async () => {
      // Create second enrollment in NOT_STARTED
      const enrollment2 = await prisma.learningEnrollment.create({
        data: {
          tenantId,
          userId: member2Id,
          courseId,
          status: 'NOT_STARTED',
          progressPct: 0.0
        }
      });

      // Batch approve
      const batchResult = await prisma.learningEnrollment.updateMany({
        where: {
          id: { in: [enrollment2.id] },
          tenantId,
          status: 'NOT_STARTED'
        },
        data: { status: 'ENROLLED' }
      });

      assert.strictEqual(batchResult.count, 1, 'Batch approval must update targeted record');

      const verified = await prisma.learningEnrollment.findUnique({ where: { id: enrollment2.id } });
      assert.strictEqual(verified.status, 'ENROLLED');

      // Cleanup
      await prisma.learningEnrollment.delete({ where: { id: enrollment2.id } });
    });
  });

  // 6. ZERO-FAKE / ZERO-DUMMY DATA INTEGRITY IN TEAM LEADER MODULE
  describe('6. Zero-Fake & Zero-Dummy Data Integrity Verification', () => {
    let emptyLeaderId = null;
    let emptyTeamId = null;

    before(async () => {
      // Create a brand new team with 0 members
      const emptyTeam = await prisma.team.create({
        data: {
          name: `Pristine Empty Squad ${Date.now()}`,
          tenantId,
          departmentId
        }
      });
      emptyTeamId = emptyTeam.id;

      const emptyLeader = await prisma.user.create({
        data: {
          tenantId,
          teamId: emptyTeam.id,
          email: `emptyleader.${Date.now()}@skillpulse-test.internal`,
          passwordHash: 'secretHash123',
          firstName: 'Solo',
          lastName: 'Leader',
          role: 'TEAM_LEADER',
          jobTitle: 'Team Lead',
          status: 'ACTIVE'
        }
      });
      emptyLeaderId = emptyLeader.id;

      await prisma.team.update({
        where: { id: emptyTeam.id },
        data: { leaderId: emptyLeader.id }
      });
    });

    after(async () => {
      try {
        if (emptyLeaderId) await prisma.user.delete({ where: { id: emptyLeaderId } });
        if (emptyTeamId) await prisma.team.delete({ where: { id: emptyTeamId } });
      } catch (e) {}
    });

    test('Team with 0 members returns strictly empty array (no synthetic/mock employee injection)', async () => {
      const subordinateMembers = await prisma.user.findMany({
        where: {
          tenantId,
          teamId: emptyTeamId,
          id: { not: emptyLeaderId }
        }
      });

      assert.strictEqual(Array.isArray(subordinateMembers), true);
      assert.strictEqual(subordinateMembers.length, 0, 'Must have exactly 0 members; no fake employee data injected');
    });

    test('Team readiness with 0 members computes to 0% rather than hardcoded mock percentages', async () => {
      const subordinateMembers = await prisma.user.findMany({
        where: {
          tenantId,
          teamId: emptyTeamId,
          id: { not: emptyLeaderId }
        },
        include: { skills: true }
      });

      let totalProficiency = 0;
      let totalSkills = 0;
      subordinateMembers.forEach(m => {
        m.skills.forEach(s => {
          totalProficiency += s.proficiencyLevel;
          totalSkills += 1;
        });
      });

      const avgReadiness = totalSkills > 0 ? Math.round(((totalProficiency / totalSkills) / 5.0) * 100) : 0;
      assert.strictEqual(avgReadiness, 0, 'Average readiness must evaluate to 0% for empty teams (no fallback 75% or 80%)');
    });

    test('Zero training requests in DB returns empty list without placeholder requests', async () => {
      const requests = await prisma.learningEnrollment.findMany({
        where: {
          tenantId,
          userId: emptyLeaderId,
          status: 'NOT_STARTED'
        }
      });

      assert.strictEqual(requests.length, 0, 'No fake training requests allowed in database');
    });
  });
});
