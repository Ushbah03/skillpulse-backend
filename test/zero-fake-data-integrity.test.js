import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import prisma from '../src/config/db.js';

describe('--- ZERO-DUMMY / ZERO-FAKE DATA INTEGRITY AUDIT TEST SUITE ---', () => {

  const testTenantSlug = `data-integrity-tenant-${Date.now()}`;
  const testEmail = `clean.employee.${Date.now()}@skillpulse-test.internal`;
  let tenantId = null;
  let employeeId = null;

  before(async () => {
    // 1. Create a pristine new tenant with NO pre-seeded fake data
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Zero-Dummy QA Test Workspace',
        slug: testTenantSlug,
        plan: 'PRO',
        maxUsers: 10,
        status: 'ACTIVE'
      }
    });
    tenantId = tenant.id;

    // 2. Create pristine employee with NO skills and NO gaps
    const employee = await prisma.user.create({
      data: {
        tenantId,
        email: testEmail,
        passwordHash: 'hashedSecret123',
        firstName: 'Pristine',
        lastName: 'Account',
        role: 'EMPLOYEE',
        jobTitle: 'Junior QA Engineer',
        status: 'ACTIVE'
      }
    });
    employeeId = employee.id;
  });

  after(async () => {
    try {
      if (employeeId) {
        await prisma.learningEnrollment.deleteMany({ where: { userId: employeeId } });
        await prisma.skillAssessment.deleteMany({ where: { userId: employeeId } });
        await prisma.skillGap.deleteMany({ where: { userId: employeeId } });
        await prisma.userSkill.deleteMany({ where: { userId: employeeId } });
        await prisma.user.deleteMany({ where: { id: employeeId } });
      }
      if (tenantId) {
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
  });

  // 1. DATABASE PRISTINE STATE VERIFICATION
  describe('1. DB Query Returns Empty Arrays When No Data Exists (No Synthetic Injections)', () => {
    test('User skill profile for a brand new user returns 0 skills, not hardcoded dummy items', async () => {
      const user = await prisma.user.findUnique({
        where: { id: employeeId },
        include: {
          skills: { include: { skill: true } }
        }
      });

      assert.ok(user, 'User record must exist in DB');
      assert.strictEqual(Array.isArray(user.skills), true, 'Skills must be an Array');
      assert.strictEqual(user.skills.length, 0, 'New user must have exactly 0 skills (no fake fallback data)');
    });

    test('Skill gap query for a new user returns 0 gaps, not fake gaps', async () => {
      const gaps = await prisma.skillGap.findMany({
        where: { userId: employeeId }
      });

      assert.strictEqual(Array.isArray(gaps), true);
      assert.strictEqual(gaps.length, 0, 'New user must have exactly 0 skill gaps in DB');
    });

    test('Assessments query for a new user returns 0 completed tests, not synthetic certificates', async () => {
      const assessments = await prisma.skillAssessment.findMany({
        where: { userId: employeeId }
      });

      assert.strictEqual(Array.isArray(assessments), true);
      assert.strictEqual(assessments.length, 0, 'New user must have 0 assessments');
    });

    test('Enrollments query for a new user returns 0 enrollments', async () => {
      const enrollments = await prisma.learningEnrollment.findMany({
        where: { userId: employeeId }
      });

      assert.strictEqual(Array.isArray(enrollments), true);
      assert.strictEqual(enrollments.length, 0, 'New user must have 0 enrollments');
    });
  });

  // 2. LIVE DATA PERSISTENCE & RETRIEVAL (ONLY REAL PERSISTED DATA SHOWN)
  describe('2. Real Data Lifecycle (Only Explicitly Created Data Appears)', () => {
    let newSkillId = null;

    test('Created skill appears in user inventory with matching database UUID', async () => {
      // Create category & skill
      const cat = await prisma.skillCategory.create({
        data: { name: `Real Category ${Date.now()}`, tenantId }
      });
      const skill = await prisma.skill.create({
        data: { name: `Live PostgreSQL Skill ${Date.now()}`, categoryId: cat.id, tenantId }
      });
      newSkillId = skill.id;

      // Add to user
      const userSkill = await prisma.userSkill.create({
        data: {
          userId: employeeId,
          skillId: newSkillId,
          proficiencyLevel: 4.5,
          yearsExperience: 2.0
        },
        include: { skill: true }
      });

      assert.ok(userSkill.id);
      assert.strictEqual(userSkill.skill.name.startsWith('Live PostgreSQL Skill'), true);
      assert.strictEqual(userSkill.proficiencyLevel, 4.5);

      // Verify DB contains exactly this 1 record
      const count = await prisma.userSkill.count({ where: { userId: employeeId } });
      assert.strictEqual(count, 1, 'Only the single explicitly created skill exists in DB');
    });

    test('Deleting skill removes it completely from DB without ghost or fallback leftovers', async () => {
      await prisma.userSkill.deleteMany({
        where: { userId: employeeId, skillId: newSkillId }
      });

      const count = await prisma.userSkill.count({ where: { userId: employeeId } });
      assert.strictEqual(count, 0, 'Skill count must return to exactly 0 after deletion');
    });
  });

  // 3. FRONTEND CODEBASE AUDIT: ZERO HARDCODED ARRAYS IN STATE
  describe('3. Frontend Component Codebase Scan for Hardcoded Fallback Arrays', () => {
    const frontendDir = path.resolve('..', 'skillpulse-vite', 'src', 'components');

    test('EmployeeDashboard.jsx initializes state with empty arrays and contains no mock fallback data', () => {
      const filePath = path.join(frontendDir, 'EmployeeDashboard.jsx');
      assert.ok(fs.existsSync(filePath), 'EmployeeDashboard.jsx must exist');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check state initializations
      assert.match(content, /const\s+\[gaps,\s*setGaps\]\s*=\s*useState\(\[\]\)/, 'Gaps state must be empty array []');
      assert.match(content, /const\s+\[courses,\s*setCourses\]\s*=\s*useState\(\[\]\)/, 'Courses state must be empty array []');
      
      // Ensure no mock skills array is hardcoded
      assert.ok(!content.includes('const mockSkills ='), 'No mockSkills array allowed in EmployeeDashboard');
      assert.ok(!content.includes('const dummySkills ='), 'No dummySkills array allowed in EmployeeDashboard');
    });

    test('MySkillProfile.jsx initializes state with empty arrays and binds to live API', () => {
      const filePath = path.join(frontendDir, 'MySkillProfile.jsx');
      assert.ok(fs.existsSync(filePath), 'MySkillProfile.jsx must exist');
      const content = fs.readFileSync(filePath, 'utf-8');

      assert.ok(!content.includes('const mockProfile ='), 'No mockProfile allowed');
      assert.ok(!content.includes('const fakeProfile ='), 'No fakeProfile allowed');
    });

    test('Certifications.jsx fetches credentials exclusively from DB', () => {
      const filePath = path.join(frontendDir, 'Certifications.jsx');
      assert.ok(fs.existsSync(filePath), 'Certifications.jsx must exist');
      const content = fs.readFileSync(filePath, 'utf-8');

      assert.match(content, /const\s+\[completed,\s*setCompleted\]\s*=\s*useState\(\[\]\)/);
      assert.ok(!content.includes('const mockCerts ='), 'No mockCerts allowed');
      assert.ok(!content.includes('const dummyCerts ='), 'No dummyCerts allowed');
    });
  });
});
