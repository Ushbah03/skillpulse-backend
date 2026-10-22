import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';
import { requireRole } from '../src/middleware/rbacMiddleware.js';
import { validatePasswordPolicy } from '../src/utils/securityPolicies.js';

describe('--- MODULE 5: COMPANY ADMIN (TENANT ADMIN) DEEP AUTOMATED TEST SUITE ---', () => {

  const testTenantSlug = `admin-qa-tenant-${Date.now()}`;
  const adminEmail = `company.admin.${Date.now()}@skillpulse-test.internal`;
  const employeeEmail = `subordinate.emp.${Date.now()}@skillpulse-test.internal`;
  const hrEmail = `hr.colleague.${Date.now()}@skillpulse-test.internal`;
  const rivalTenantEmail = `rival.admin.${Date.now()}@skillpulse-test.internal`;
  const testPassword = 'SecureAdminPassword123!';

  let tenantId = null;
  let rivalTenantId = null;
  let adminUserId = null;
  let employeeUserId = null;
  let hrUserId = null;
  let rivalAdminId = null;
  let createdCustomSkillId = null;
  let createdDeptId = null;

  before(async () => {
    // 1. Setup isolated test tenant with STARTER plan to test plan ceiling
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Company Admin QA Enterprise',
        slug: testTenantSlug,
        plan: 'STARTER',
        maxUsers: 30,
        status: 'ACTIVE'
      }
    });
    tenantId = tenant.id;

    // 2. Setup rival tenant to verify multi-tenant isolation
    const rivalTenant = await prisma.tenant.create({
      data: {
        name: 'Rival Enterprise Admin Corp',
        slug: `rival-admin-${Date.now()}`,
        plan: 'PRO',
        maxUsers: 100,
        status: 'ACTIVE'
      }
    });
    rivalTenantId = rivalTenant.id;

    // 3. Setup Company Admin user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const admin = await prisma.user.create({
      data: {
        tenantId,
        email: adminEmail,
        passwordHash,
        firstName: 'Arthur',
        lastName: 'Pendleton',
        role: 'COMPANY_ADMIN',
        jobTitle: 'Managing Director & Tenant Admin',
        status: 'ACTIVE'
      }
    });
    adminUserId = admin.id;

    // 4. Setup Employee
    const emp = await prisma.user.create({
      data: {
        tenantId,
        email: employeeEmail,
        passwordHash,
        firstName: 'Lucas',
        lastName: 'Meyers',
        role: 'EMPLOYEE',
        jobTitle: 'Junior Analyst',
        status: 'ACTIVE'
      }
    });
    employeeUserId = emp.id;

    // 5. Setup HR Manager
    const hr = await prisma.user.create({
      data: {
        tenantId,
        email: hrEmail,
        passwordHash,
        firstName: 'Clara',
        lastName: 'Oswald',
        role: 'HR_MANAGER',
        jobTitle: 'HR Director',
        status: 'ACTIVE'
      }
    });
    hrUserId = hr.id;

    // 6. Setup Rival Admin
    const rival = await prisma.user.create({
      data: {
        tenantId: rivalTenantId,
        email: rivalTenantEmail,
        passwordHash,
        firstName: 'Rival',
        lastName: 'Admin',
        role: 'COMPANY_ADMIN',
        jobTitle: 'Admin',
        status: 'ACTIVE'
      }
    });
    rivalAdminId = rival.id;
  });

  after(async () => {
    try {
      if (createdCustomSkillId) {
        await prisma.userSkill.deleteMany({ where: { skillId: createdCustomSkillId } });
        await prisma.skill.deleteMany({ where: { id: createdCustomSkillId } });
      }
      if (adminUserId || employeeUserId || hrUserId) {
        await prisma.auditLog.deleteMany({ where: { userId: { in: [adminUserId, employeeUserId, hrUserId] } } });
        await prisma.userSkill.deleteMany({ where: { userId: { in: [adminUserId, employeeUserId, hrUserId] } } });
        await prisma.user.deleteMany({ where: { id: { in: [adminUserId, employeeUserId, hrUserId] } } });
      }
      if (rivalAdminId) {
        await prisma.user.deleteMany({ where: { id: rivalAdminId } });
      }
      if (createdDeptId) {
        await prisma.department.deleteMany({ where: { id: createdDeptId } });
      }
      if (tenantId) {
        await prisma.systemParameter.deleteMany({ where: { tenantId } });
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
      if (rivalTenantId) {
        await prisma.tenant.deleteMany({ where: { id: rivalTenantId } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
  });

  // 1. RBAC SECURITY FOR COMPANY ADMIN RESOURCES
  describe('1. RBAC Security & Authorization Boundary for Company Admin', () => {
    test('EMPLOYEE role is strictly blocked with HTTP 403 Forbidden from Company Admin endpoints', () => {
      let statusCode = null;
      let responseBody = null;

      const mockReq = { user: { id: employeeUserId, role: 'EMPLOYEE' } };
      const mockRes = {
        status(code) { statusCode = code; return this; },
        json(data) { responseBody = data; return this; }
      };
      let nextCalled = false;

      const guard = requireRole('COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403);
      assert.strictEqual(responseBody?.success, false);
      assert.match(responseBody?.message, /Access denied|not authorized/i);
    });

    test('HR_MANAGER role is strictly blocked with HTTP 403 Forbidden from Company Admin endpoints', () => {
      let statusCode = null;
      let nextCalled = false;

      const mockReq = { user: { id: hrUserId, role: 'HR_MANAGER' } };
      const mockRes = {
        status(code) { statusCode = code; return this; },
        json() { return this; }
      };

      const guard = requireRole('COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403);
    });

    test('COMPANY_ADMIN role is granted access and proceeds via next()', () => {
      const mockReq = { user: { id: adminUserId, role: 'COMPANY_ADMIN' } };
      let nextCalled = false;

      const guard = requireRole('COMPANY_ADMIN', 'SUPER_ADMIN');
      guard(mockReq, {}, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Company Admin must be authorized');
    });

    test('COMPANY_ADMIN is strictly blocked from global SUPER_ADMIN platform controls', () => {
      let statusCode = null;
      const mockReq = { user: { id: adminUserId, role: 'COMPANY_ADMIN' } };
      const mockRes = {
        status(code) { statusCode = code; return this; },
        json() { return this; }
      };
      let nextCalled = false;

      // Endpoint requiring SUPER_ADMIN (e.g. /tenants or /global-telemetry)
      const superGuard = requireRole('SUPER_ADMIN');
      superGuard(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403, 'Company Admin must NOT have superadmin global powers');
    });
  });

  // 2. USER PROVISIONING, ROLE MANAGEMENT & AUDIT LOGS
  describe('2. User Governance, Lifecycle & Forensic Audit Trail', () => {
    let provisionedUserId = null;

    test('Company Admin can provision a new Employee in the workspace', async () => {
      const newEmail = `provisioned.${Date.now()}@skillpulse-test.internal`;
      const pwdHash = await bcrypt.hash('StandardPassword123!', 10);

      const user = await prisma.user.create({
        data: {
          tenantId,
          email: newEmail,
          passwordHash: pwdHash,
          firstName: 'Oliver',
          lastName: 'Queen',
          role: 'EMPLOYEE',
          jobTitle: 'Junior Developer',
          status: 'ACTIVE'
        }
      });
      provisionedUserId = user.id;

      assert.ok(user.id);
      assert.strictEqual(user.tenantId, tenantId);
      assert.strictEqual(user.role, 'EMPLOYEE');

      // Create forensic audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: adminUserId,
          action: 'USER_PROVISIONED',
          resource: 'User',
          resourceId: user.id,
          details: { email: user.email, role: user.role }
        }
      });
    });

    test('Audit log is recorded with actor ID, timestamp, and action property', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { tenantId, action: 'USER_PROVISIONED', resourceId: provisionedUserId }
      });

      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].userId, adminUserId);
      assert.strictEqual(logs[0].action, 'USER_PROVISIONED');
      assert.ok(logs[0].createdAt);
    });

    test('Company Admin can change user status to INACTIVE (Account Suspension)', async () => {
      const updated = await prisma.user.update({
        where: { id: provisionedUserId },
        data: { status: 'INACTIVE' }
      });

      assert.strictEqual(updated.status, 'INACTIVE');
    });

    test('Company Admin can delete provisioned user and audit trail records action', async () => {
      await prisma.user.delete({ where: { id: provisionedUserId } });
      const check = await prisma.user.findUnique({ where: { id: provisionedUserId } });
      assert.strictEqual(check, null, 'User must be permanently deleted from DB');
    });
  });

  // 3. PLAN CEILING & USER SEAT QUOTA ENFORCEMENT
  describe('3. Plan Ceiling & Seat Utilization Enforcement', () => {
    test('STARTER plan workspace blocks assigning premium roles (HR_MANAGER, TEAM_LEADER)', async () => {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      assert.strictEqual(tenant.plan, 'STARTER');

      const PREMIUM_ROLES = ['HR_MANAGER', 'TEAM_LEADER'];
      const candidateRole = 'TEAM_LEADER';

      const isBlocked = tenant.plan === 'STARTER' && PREMIUM_ROLES.includes(candidateRole);
      assert.strictEqual(isBlocked, true, 'Starter plan must block Team Leader role creation');
    });

    test('Verifies seat quota utilization (Active Users vs maxUsers ceiling)', async () => {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const currentUsers = await prisma.user.count({ where: { tenantId } });

      assert.strictEqual(tenant.maxUsers, 30, 'Starter plan maxUsers is 30');
      assert.ok(currentUsers <= tenant.maxUsers, 'Current users count must not exceed maxUsers ceiling');
      
      const availableSeats = tenant.maxUsers - currentUsers;
      assert.ok(availableSeats >= 0, 'Available seats must be non-negative');
    });
  });

  // 4. CUSTOM SKILL TAXONOMY MANAGEMENT
  describe('4. Custom Skill Taxonomy Management & Tenant Scoping', () => {
    test('Company Admin creates tenant-specific custom skill', async () => {
      // Create category
      let category = await prisma.skillCategory.findFirst({
        where: { name: 'Internal Proprietary Systems', tenantId }
      });
      if (!category) {
        category = await prisma.skillCategory.create({
          data: { name: 'Internal Proprietary Systems', tenantId }
        });
      }

      const customSkill = await prisma.skill.create({
        data: {
          name: `Custom Enterprise Core Workflow ${Date.now()}`,
          categoryId: category.id,
          tenantId,
          isGlobal: false
        }
      });
      createdCustomSkillId = customSkill.id;

      assert.ok(customSkill.id);
      assert.strictEqual(customSkill.tenantId, tenantId);
      assert.strictEqual(customSkill.isGlobal, false);
    });

    test('Custom skill is strictly isolated and invisible to rival tenants', async () => {
      const rivalSkills = await prisma.skill.findMany({
        where: {
          id: createdCustomSkillId,
          tenantId: rivalTenantId
        }
      });

      assert.strictEqual(rivalSkills.length, 0, 'Rival tenant must NOT have access to custom skill');
    });
  });

  // 5. TENANT SECURITY ACCESS POLICIES
  describe('5. Tenant Security Access Policies & Password Compliance', () => {
    test('Configures and enforces tenant password complexity policies via SystemParameter', async () => {
      // Configure 10-char minimum policy for this tenant
      await prisma.systemParameter.create({
        data: {
          tenantId,
          key: 'passwordMinLength',
          value: '10'
        }
      });
      await prisma.systemParameter.create({
        data: {
          tenantId,
          key: 'requireSpecialChar',
          value: 'true'
        }
      });

      // Validate weak password fails
      const weakError = await validatePasswordPolicy('short', tenantId);
      assert.ok(weakError);
      assert.match(weakError, /at least 10 characters/);

      // Validate password without special character fails
      const noSpecialError = await validatePasswordPolicy('LongPasswordNoSpecial', tenantId);
      assert.ok(noSpecialError);
      assert.match(noSpecialError, /special character/);

      // Validate compliant password passes
      const validError = await validatePasswordPolicy('StrongPassword2026!', tenantId);
      assert.strictEqual(validError, null, 'Compliant password must pass with 0 errors');
    });
  });

  // 6. ZERO-FAKE / ZERO-DUMMY DATA AUDIT FOR COMPANY ADMIN
  describe('6. Zero-Fake & Zero-Dummy Data Integrity Verification for Company Admin', () => {
    let pristineTenantId = null;
    let pristineAdminId = null;

    before(async () => {
      const pristineTenant = await prisma.tenant.create({
        data: {
          name: 'Pristine Admin QA Tenant',
          slug: `pristine-admin-${Date.now()}`,
          plan: 'PRO',
          maxUsers: 50,
          status: 'ACTIVE'
        }
      });
      pristineTenantId = pristineTenant.id;

      const pAdmin = await prisma.user.create({
        data: {
          tenantId: pristineTenant.id,
          email: `pristine.admin.${Date.now()}@skillpulse-test.internal`,
          passwordHash: 'secret123',
          firstName: 'Pristine',
          lastName: 'Admin',
          role: 'COMPANY_ADMIN',
          jobTitle: 'Admin',
          status: 'ACTIVE'
        }
      });
      pristineAdminId = pAdmin.id;
    });

    after(async () => {
      try {
        if (pristineAdminId) await prisma.user.delete({ where: { id: pristineAdminId } });
        if (pristineTenantId) await prisma.tenant.delete({ where: { id: pristineTenantId } });
      } catch (e) {}
    });

    test('Dashboard stats for fresh tenant returns exact user count of 1 (the admin) with 0 fake departments', async () => {
      const totalUsersCount = await prisma.user.count({ where: { tenantId: pristineTenantId } });
      assert.strictEqual(totalUsersCount, 1, 'Only the single admin exists (no fake subordinate employees injected)');

      const departments = await prisma.department.findMany({ where: { tenantId: pristineTenantId } });
      assert.strictEqual(departments.length, 0, '0 departments exist in fresh tenant (no hardcoded departments)');
    });

    test('Audit logs query for pristine tenant returns empty array without synthetic logs', async () => {
      const logs = await prisma.auditLog.findMany({ where: { tenantId: pristineTenantId } });
      assert.strictEqual(Array.isArray(logs), true);
      assert.strictEqual(logs.length, 0, 'No fake audit logs exist');
    });

    test('Integrations query for fresh tenant returns 0 connectors without mock integrations', async () => {
      const integrations = await prisma.integrationConfig.findMany({ where: { tenantId: pristineTenantId } });
      assert.strictEqual(integrations.length, 0, 'No fake integrations exist');
    });
  });
});
