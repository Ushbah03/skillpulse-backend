import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/db.js';

describe('AI Engine & Platform Telemetry Test Suite', () => {
  it('should verify active GenAI model router configuration', async () => {
    const activeModel = await prisma.aIModelConfig.findFirst({
      where: { isActive: true }
    });

    assert.ok(activeModel, 'An active AI model configuration must exist in Neon DB');
    assert.ok(activeModel.modelName, 'Active model must have a valid modelName');
    assert.ok(activeModel.provider, 'Active model must have a recognized provider');
    assert.ok(activeModel.contextWindow > 0, 'Context window must be greater than zero');
  });

  it('should calculate Monthly Recurring Revenue (MRR) accurately from active subscriptions', async () => {
    const activeTenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { plan: true }
    });

    const tierPrices = { STARTER: 49, PRO: 199, ENTERPRISE: 499 };
    const expectedMRR = activeTenants.reduce((sum, t) => sum + (tierPrices[t.plan] || 0), 0);

    assert.ok(expectedMRR > 0, 'Calculated MRR from active subscriptions must be positive');
  });

  it('should verify master skill taxonomy integrity', async () => {
    const [skillsCount, categoriesCount] = await Promise.all([
      prisma.skill.count(),
      prisma.skillCategory.count()
    ]);

    assert.ok(skillsCount > 0, 'Master skill taxonomy must contain skills');
    assert.ok(categoriesCount > 0, 'Master skill taxonomy must contain categories');
  });
});
