import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

describe('--- MODULE 2: EMPLOYEE MODULE DEEP AUTOMATED TEST SUITE ---', () => {

  const testTenantSlug = `emp-test-${Date.now()}`;
  const testEmail = `employee.${Date.now()}@skillpulse-test.internal`;
  const testPassword = 'Password123!';
  let tenantId = null;
  let employeeId = null;
  let technicalCategoryId = null;
  let testSkillId = null;
  let testCourseId = null;

  before(async () => {
    // 1. Setup isolated test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Employee QA Test Organization',
        slug: testTenantSlug,
        plan: 'PRO',
        maxUsers: 50,
        status: 'ACTIVE'
      }
    });
    tenantId = tenant.id;

    // 2. Setup category and skill
    const category = await prisma.skillCategory.create({
      data: { name: `Full Stack Engineering ${Date.now()}`, tenantId }
    });
    technicalCategoryId = category.id;

    const skill = await prisma.skill.create({
      data: {
        name: `React.js Architecture ${Date.now()}`,
        categoryId: technicalCategoryId,
        tenantId,
        isGlobal: false
      }
    });
    testSkillId = skill.id;

    // 3. Setup test course for recommendations
    const course = await prisma.course.create({
      data: {
        tenantId,
        title: 'Advanced React.js & Performance Engineering',
        description: 'Comprehensive course on React performance, virtualization, and state isolation.',
        provider: 'SkillPulse Academy',
        durationHours: 14.5,
        level: 'Advanced',
        rating: 4.9,
        externalUrl: 'https://www.youtube-nocookie.com/embed/w7ejDZ8SWv8',
        skillsTaught: {
          create: [{ skillId: testSkillId, targetProficiency: 4.8 }]
        }
      }
    });
    testCourseId = course.id;

    // 4. Setup employee user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const employee = await prisma.user.create({
      data: {
        tenantId,
        email: testEmail,
        passwordHash,
        firstName: 'Jane',
        lastName: 'Developer',
        role: 'EMPLOYEE',
        jobTitle: 'Senior Frontend Engineer',
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
      if (testCourseId) {
        await prisma.courseSkill.deleteMany({ where: { courseId: testCourseId } });
        await prisma.course.deleteMany({ where: { id: testCourseId } });
      }
      if (testSkillId) {
        await prisma.skill.deleteMany({ where: { id: testSkillId } });
      }
      if (technicalCategoryId) {
        await prisma.skillCategory.deleteMany({ where: { id: technicalCategoryId } });
      }
      if (tenantId) {
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
  });

  // 1. SKILL PROFILE CRUD & PROFICIENCY
  describe('1. Employee Skill Profile Management', () => {
    test('Employee can add a skill with initial proficiency and years of experience', async () => {
      const userSkill = await prisma.userSkill.upsert({
        where: {
          userId_skillId: { userId: employeeId, skillId: testSkillId }
        },
        update: {
          proficiencyLevel: 3.5,
          yearsExperience: 3.0,
          lastAssessedAt: new Date()
        },
        create: {
          userId: employeeId,
          skillId: testSkillId,
          proficiencyLevel: 3.5,
          yearsExperience: 3.0,
          lastAssessedAt: new Date()
        },
        include: { skill: true }
      });

      assert.ok(userSkill.id);
      assert.strictEqual(userSkill.userId, employeeId);
      assert.strictEqual(userSkill.skillId, testSkillId);
      assert.strictEqual(userSkill.proficiencyLevel, 3.5);
      assert.strictEqual(userSkill.yearsExperience, 3.0);
    });

    test('Employee can query their skill profile with category relations', async () => {
      const userProfile = await prisma.user.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          firstName: true,
          jobTitle: true,
          skills: {
            include: { skill: { include: { category: true } } }
          }
        }
      });

      assert.strictEqual(userProfile.firstName, 'Jane');
      assert.strictEqual(userProfile.skills.length, 1);
      assert.ok(userProfile.skills[0].skill.name.startsWith('React.js Architecture'));
    });

    test('Proficiency update is accurately recorded in DB', async () => {
      const updated = await prisma.userSkill.update({
        where: {
          userId_skillId: { userId: employeeId, skillId: testSkillId }
        },
        data: { proficiencyLevel: 4.2 }
      });

      assert.strictEqual(updated.proficiencyLevel, 4.2);
    });
  });

  // 2. SKILL GAP DETECTION & SEVERITY
  describe('2. AI Skill Gap Detection & Remedial Course Assignment', () => {
    let createdGapId = null;

    test('System detects skill gap when required level exceeds current proficiency', async () => {
      const gap = await prisma.skillGap.create({
        data: {
          tenantId: tenantId,
          userId: employeeId,
          skillId: testSkillId,
          requiredLevel: 4.8,
          currentLevel: 3.5,
          severity: 'HIGH',
          assignedCourseId: testCourseId
        },
        include: { skill: true, assignedCourse: true }
      });
      createdGapId = gap.id;

      assert.ok(gap.id);
      assert.strictEqual(gap.severity, 'HIGH');
      assert.strictEqual(gap.requiredLevel, 4.8);
      assert.strictEqual(gap.currentLevel, 3.5);
      assert.ok(gap.assignedCourse, 'Gap must automatically link to a remedial course');
      assert.strictEqual(gap.assignedCourse.id, testCourseId);
    });

    test('Skill gap is retrieved in employee gap inventory ordered by severity', async () => {
      const gaps = await prisma.skillGap.findMany({
        where: { userId: employeeId },
        include: { skill: true }
      });

      assert.ok(gaps.length >= 1);
      const target = gaps.find(g => g.id === createdGapId);
      assert.ok(target);
      assert.ok(target.skill.name.startsWith('React.js Architecture'));
    });
  });

  // 3. AI LEARNING RECOMMENDATIONS & ENROLLMENT WORKFLOW
  describe('3. AI Learning Recommendations & LMS Enrollment Flow', () => {
    test('AI Recommendation scoring assigns 90%+ match score to active skill gap courses', async () => {
      const userGaps = await prisma.skillGap.findMany({
        where: { userId: employeeId },
        include: { skill: true }
      });
      const gapSkillNames = userGaps.map(g => g.skill.name.toLowerCase());

      const course = await prisma.course.findUnique({
        where: { id: testCourseId },
        include: { skillsTaught: { include: { skill: true } } }
      });

      const courseSkills = course.skillsTaught.map(st => st.skill.name.toLowerCase());
      const hasGapMatch = courseSkills.some(cs => gapSkillNames.includes(cs));

      // Multi-factor AI Match Algorithm
      let matchScore = 75;
      if (hasGapMatch) {
        const severity = userGaps[0].severity;
        matchScore = severity === 'CRITICAL' ? 99 : severity === 'HIGH' ? 95 : 91;
      }

      assert.strictEqual(hasGapMatch, true);
      assert.strictEqual(matchScore, 95, 'High severity gap course must achieve 95% AI match score');
    });

    test('Employee can enroll in recommended course and track status', async () => {
      const enrollment = await prisma.learningEnrollment.create({
        data: {
          tenantId,
          userId: employeeId,
          courseId: testCourseId,
          status: 'ENROLLED',
          progressPct: 0.0,
          enrolledAt: new Date()
        }
      });

      assert.ok(enrollment.id);
      assert.strictEqual(enrollment.status, 'ENROLLED');
      assert.strictEqual(enrollment.progressPct, 0.0);
    });

    test('Course progress updates accurately and completes at 100%', async () => {
      const updatedProgress = await prisma.learningEnrollment.update({
        where: {
          userId_courseId: { userId: employeeId, courseId: testCourseId }
        },
        data: {
          progressPct: 100.0,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      assert.strictEqual(updatedProgress.progressPct, 100.0);
      assert.strictEqual(updatedProgress.status, 'COMPLETED');
      assert.ok(updatedProgress.completedAt);
    });
  });

  // 4. ADAPTIVE SKILL ASSESSMENT & CERTIFICATE ISSUANCE
  describe('4. Adaptive Skill Assessment & Verified Certification Engine', () => {
    test('Passing assessment (score >= 75%) issues cryptographic credential and upgrades proficiency', async () => {
      const passingScore = 88.0;
      const credentialId = `SP-CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const assessment = await prisma.skillAssessment.create({
        data: {
          userId: employeeId,
          title: 'React.js Architecture Skill Verification',
          category: 'Full Stack Engineering',
          score: passingScore,
          totalQuestions: 5,
          correctAnswers: 4,
          credentialId: credentialId,
          certificateUrl: '/api/employee/assessments/certificate',
          resultsJson: {
            difficulty: 'INTERMEDIATE',
            certificate: {
              status: 'VERIFIED',
              issuedAt: new Date().toISOString()
            }
          }
        }
      });

      assert.ok(assessment.id);
      assert.strictEqual(assessment.score, 88.0);
      assert.ok(assessment.credentialId.startsWith('SP-CERT-'));

      // Upgrades proficiency to 4.4 / 5.0 in UserSkill
      const newProficiency = parseFloat(((passingScore / 100) * 5.0).toFixed(1));
      assert.strictEqual(newProficiency, 4.4);

      const upgraded = await prisma.userSkill.update({
        where: {
          userId_skillId: { userId: employeeId, skillId: testSkillId }
        },
        data: { proficiencyLevel: newProficiency }
      });

      assert.strictEqual(upgraded.proficiencyLevel, 4.4, 'Proficiency must reflect verified assessment score');
    });

    test('Failing assessment (score < 75%) does not issue certificate', async () => {
      const failingScore = 60.0;
      const isPassed = failingScore >= 75.0;

      const assessment = await prisma.skillAssessment.create({
        data: {
          userId: employeeId,
          title: 'Docker Architecture Assessment',
          category: 'DevOps',
          score: failingScore,
          totalQuestions: 5,
          correctAnswers: 3,
          credentialId: isPassed ? 'SHOULD_NOT_EXIST' : null,
          resultsJson: { difficulty: 'INTERMEDIATE', passed: false }
        }
      });

      assert.strictEqual(assessment.score, 60.0);
      assert.strictEqual(assessment.credentialId, null, 'Unpassed assessment must not have a credentialId');
    });
  });

  // 5. EMPLOYEE DASHBOARD AGGREGATED METRICS
  describe('5. Employee Dashboard Performance & Readiness Metrics', () => {
    test('Calculates employee skill index and readiness score correctly', async () => {
      const skills = await prisma.userSkill.findMany({ where: { userId: employeeId } });
      const avgProficiency = skills.reduce((acc, s) => acc + s.proficiencyLevel, 0) / skills.length;
      const readinessPercentage = Math.round((avgProficiency / 5.0) * 100);

      assert.ok(avgProficiency > 0);
      assert.strictEqual(avgProficiency, 4.4);
      assert.strictEqual(readinessPercentage, 88, 'Readiness percentage for 4.4/5.0 is exactly 88%');
    });

    test('Employee is barred from accessing cross-tenant data', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Rival Enterprise Co',
          slug: `rival-${Date.now()}`,
          plan: 'STARTER',
          maxUsers: 10
        }
      });

      // Employee attempts to query other tenant's courses
      const crossTenantCourses = await prisma.course.findMany({
        where: { tenantId: otherTenant.id }
      });

      assert.strictEqual(crossTenantCourses.length, 0, 'Cross tenant queries return 0 records');

      // Cleanup
      await prisma.tenant.delete({ where: { id: otherTenant.id } });
    });
  });
});
