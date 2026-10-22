import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/db.js';

describe('Security Audit Trail & Compliance Test Suite', () => {
  it('should verify recorded audit logs contain essential forensic properties', async () => {
    const logs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    assert.ok(logs.length > 0, 'Audit logs must exist in database');

    for (const log of logs) {
      assert.ok(log.action, 'Audit log must have an action string');
      assert.ok(log.resource, 'Audit log must have a resource string');
      assert.ok(log.createdAt instanceof Date, 'Audit log must have a valid createdAt timestamp');
    }
  });

  it('should verify audit logs are chronologically ordered descending', async () => {
    const logs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    for (let i = 0; i < logs.length - 1; i++) {
      assert.ok(
        new Date(logs[i].createdAt) >= new Date(logs[i + 1].createdAt),
        'Audit logs must be ordered chronologically descending'
      );
    }
  });
});
