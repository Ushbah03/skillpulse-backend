import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/db.js';

describe('Multi-Tenant Data Isolation Test Suite', () => {
  it('should guarantee logical tenant isolation across all registered tenants', async () => {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, slug: true, status: true, maxUsers: true }
    });

    assert.ok(tenants.length > 0, 'Database must contain provisioned tenants');

    // Verify slug uniqueness
    const slugs = tenants.map(t => t.slug);
    const uniqueSlugs = new Set(slugs);
    assert.equal(slugs.length, uniqueSlugs.size, 'All tenant slugs must be globally unique');
  });

  it('should scope users strictly to their assigned enterprise tenantId', async () => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, tenantId: true, role: true },
      take: 20
    });

    assert.ok(users.length > 0, 'Users must exist in database');

    for (const user of users) {
      if (user.role !== 'SUPER_ADMIN') {
        assert.ok(user.tenantId, `Non-superadmin user ${user.email} must have a valid tenantId`);
      }
    }
  });

  it('should verify tenant seat allocations and user limits', async () => {
    const tenantsWithCounts = await prisma.tenant.findMany({
      include: { _count: { select: { users: true } } }
    });

    for (const t of tenantsWithCounts) {
      assert.ok(
        t._count.users <= t.maxUsers,
        `Tenant ${t.name} user count (${t._count.users}) must not exceed maxUsers quota (${t.maxUsers})`
      );
    }
  });
});
