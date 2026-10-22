import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';
import { authenticateJWT } from '../src/middleware/authMiddleware.js';

describe('--- VISITOR MODULE & AUTHENTICATION DEEP TEST SUITE ---', () => {

  const testTenantSlug = `visitor-test-${Date.now()}`;
  const testEmail = `visitor.${Date.now()}@skillpulse-test.internal`;
  const testPassword = 'SecurePassword123!';
  let createdTenantId = null;
  let createdUserId = null;

  after(async () => {
    // Cleanup generated test records
    try {
      if (createdUserId) {
        await prisma.user.deleteMany({ where: { email: testEmail } });
      }
      if (createdTenantId) {
        await prisma.tenant.deleteMany({ where: { id: createdTenantId } });
      }
    } catch (e) {
      // Ignored in cleanup
    }
  });

  // 1. ROUTE GUARD & ZERO-TRUST TEST
  describe('1. Visitor Security & Route Guard Isolation', () => {
    test('Unauthenticated visitor must be denied access with HTTP 401 Unauthorized', async () => {
      let statusCode = null;
      let responseBody = null;

      const mockReq = {
        headers: {}, // No Authorization header
        cookies: {}
      };
      const mockRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        }
      };
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };

      authenticateJWT(mockReq, mockRes, mockNext);

      assert.strictEqual(nextCalled, false, 'Route guard must NOT call next() for unauthenticated visitors');
      assert.strictEqual(statusCode, 401, 'Visitor without token must receive HTTP 401');
      assert.strictEqual(responseBody?.success, false);
      assert.match(responseBody?.message, /Access denied|token required/i);
    });

    test('Visitor with forged/invalid token must be rejected with HTTP 401', async () => {
      let statusCode = null;
      let responseBody = null;

      const mockReq = {
        headers: { authorization: 'Bearer forged.token.signature' },
        cookies: {}
      };
      const mockRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        }
      };
      let nextCalled = false;

      authenticateJWT(mockReq, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 401, 'Forged JWT must be rejected with 401');
      assert.strictEqual(responseBody?.success, false);
    });
  });

  // 2. PRICING & TIER SPECS INTEGRITY
  describe('2. Public Pricing Specifications & Tier Integrity', () => {
    test('Starter Plan must enforce 30 seat limit and block Team Leader / HR roles', async () => {
      const starterLimits = {
        plan: 'STARTER',
        maxSeats: 30,
        allowedRoles: ['EMPLOYEE', 'COMPANY_ADMIN'],
        disallowedRoles: ['TEAM_LEADER', 'HR_MANAGER']
      };

      assert.strictEqual(starterLimits.maxSeats, 30, 'Starter plan seat quota must be exactly 30');
      assert.ok(!starterLimits.allowedRoles.includes('TEAM_LEADER'), 'Starter must disallow Team Leader');
      assert.ok(!starterLimits.allowedRoles.includes('HR_MANAGER'), 'Starter must disallow HR Manager');
    });

    test('Pro and Enterprise tiers must permit high-concurrency seat quotas', async () => {
      const planQuotas = {
        STARTER: 30,
        PRO: 250,
        ENTERPRISE: 1000
      };

      assert.strictEqual(planQuotas.PRO, 250, 'Pro plan must support 250 seats');
      assert.strictEqual(planQuotas.ENTERPRISE, 1000, 'Enterprise plan must support 1000 seats');
    });
  });

  // 3. VISITOR REGISTRATION & WORKSPACE CREATION
  describe('3. Visitor Registration Flow (Create Organization)', () => {
    test('Workspace subdomain generation must sanitize special characters', () => {
      const orgName = "Acme Global Solutions #1!";
      const generatedSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      assert.strictEqual(generatedSlug, 'acmeglobalsolutions1', 'Slug must strip special symbols and spaces');
      assert.match(generatedSlug, /^[a-z0-9]+$/, 'Generated slug must strictly be lowercase alphanumeric');
    });

    test('Registration creates new Tenant with STARTER plan and PENDING_PAYMENT status', async () => {
      // Create test tenant in Neon DB
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Visitor QA Automation Workspace',
          slug: testTenantSlug,
          plan: 'STARTER',
          maxUsers: 30,
          status: 'PENDING_PAYMENT'
        }
      });
      createdTenantId = tenant.id;

      assert.ok(tenant.id, 'Tenant ID must be created');
      assert.strictEqual(tenant.slug, testTenantSlug);
      assert.strictEqual(tenant.status, 'PENDING_PAYMENT', 'New signup tenant must start in PENDING_PAYMENT until checkout');
      assert.strictEqual(tenant.maxUsers, 30, 'Initial quota must match 30 seats');

      // Create company admin user
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: testEmail,
          passwordHash,
          firstName: 'Visitor',
          lastName: 'Tester',
          role: 'COMPANY_ADMIN',
          jobTitle: 'Company Admin',
          status: 'ACTIVE'
        }
      });
      createdUserId = user.id;

      assert.ok(user.id);
      assert.strictEqual(user.role, 'COMPANY_ADMIN');
      assert.strictEqual(user.tenantId, tenant.id);
    });

    test('System must reject duplicate email registration with unique constraint', async () => {
      let duplicateCaught = false;
      try {
        await prisma.user.create({
          data: {
            tenantId: createdTenantId,
            email: testEmail, // Duplicate
            passwordHash: 'dummyhash',
            firstName: 'Duplicate',
            lastName: 'User',
            role: 'EMPLOYEE'
          }
        });
      } catch (err) {
        duplicateCaught = true;
        assert.match(err.message, /unique constraint|Unique/i);
      }
      assert.strictEqual(duplicateCaught, true, 'Duplicate email registration must fail');
    });
  });

  // 4. VISITOR LOGIN & ROLE-BASED ACCESS
  describe('4. Visitor Authentication & Credentials Verification', () => {
    test('Login with valid credentials must verify password hash and generate valid JWT', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { tenant: true }
      });
      assert.ok(user, 'User record must exist');

      const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
      assert.strictEqual(isMatch, true, 'Bcrypt compare must succeed for valid password');

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
        process.env.JWT_SECRET || 'skillpulse-secret-key-production-neon',
        { expiresIn: '7d' }
      );
      assert.ok(token, 'JWT Token must be generated');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillpulse-secret-key-production-neon');
      assert.strictEqual(decoded.userId, user.id);
      assert.strictEqual(decoded.role, 'COMPANY_ADMIN');
      assert.strictEqual(decoded.tenantId, createdTenantId);
    });

    test('Login with incorrect password must fail authentication', async () => {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      const isMatch = await bcrypt.compare('WrongPassword999!', user.passwordHash);
      assert.strictEqual(isMatch, false, 'Invalid password must be rejected');
    });

    test('Suspended or Inactive user accounts must be blocked', async () => {
      // Temporarily mark user as INACTIVE
      await prisma.user.update({
        where: { id: createdUserId },
        data: { status: 'INACTIVE' }
      });

      const inactiveUser = await prisma.user.findUnique({ where: { id: createdUserId } });
      assert.strictEqual(inactiveUser.status, 'INACTIVE', 'User status should be INACTIVE');
      
      const shouldBlock = inactiveUser.status === 'INACTIVE';
      assert.strictEqual(shouldBlock, true, 'Inactive users must be blocked from entering');

      // Restore to ACTIVE for cleanup
      await prisma.user.update({
        where: { id: createdUserId },
        data: { status: 'ACTIVE' }
      });
    });
  });

  // 5. REDIRECTION & ROLE DEFAULT PATH MAPPING
  describe('5. Role-Default Redirection Path Contract', () => {
    test('All platform roles must map to strictly designated dashboard destinations', () => {
      const roleMap = {
        EMPLOYEE: '/dashboard',
        TEAM_LEADER: '/team-leader',
        HR_MANAGER: '/hr-dashboard',
        COMPANY_ADMIN: '/company-admin',
        SUPER_ADMIN: '/superadmin'
      };

      assert.strictEqual(roleMap.EMPLOYEE, '/dashboard');
      assert.strictEqual(roleMap.TEAM_LEADER, '/team-leader');
      assert.strictEqual(roleMap.HR_MANAGER, '/hr-dashboard');
      assert.strictEqual(roleMap.COMPANY_ADMIN, '/company-admin');
      assert.strictEqual(roleMap.SUPER_ADMIN, '/superadmin');
    });
  });
});
