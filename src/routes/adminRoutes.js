import express from 'express';
import {
  getTenants,
  createTenant,
  updateTenant,
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getSkillTaxonomy,
  createSkill,
  updateSkill,
  deleteSkill,
  getAIConfigs,
  createAIConfig,
  getAuditLogs,
  getDashboardStats,
  getGlobalTelemetry,
  updateAIConfig,
  getSecurityPolicies,
  updateSecurityPolicies,
  getIntegrations,
  createIntegration,
  updateIntegrationStatus,
  triggerIntegrationSync
} from '../controllers/adminController.js';
import { syncHrisDirectory } from '../controllers/hrisSyncController.js';
import { syncLmsCatalog } from '../controllers/lmsSyncController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'));

router.get('/tenants', requireRole('SUPER_ADMIN'), getTenants);
router.post('/tenants', requireRole('SUPER_ADMIN'), createTenant);
router.patch('/tenants/:id', requireRole('SUPER_ADMIN'), updateTenant);
router.get('/global-telemetry', requireRole('SUPER_ADMIN'), getGlobalTelemetry);
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:userId', updateUserRole);
router.delete('/users/:userId', deleteUser);
router.get('/taxonomy', getSkillTaxonomy);
router.post('/taxonomy/skills', createSkill);
router.patch('/taxonomy/skills/:id', updateSkill);
router.delete('/taxonomy/skills/:id', deleteSkill);
router.get('/ai-config', requireRole('SUPER_ADMIN'), getAIConfigs);
router.post('/ai-config', requireRole('SUPER_ADMIN'), createAIConfig);
router.patch('/ai-config/:id', requireRole('SUPER_ADMIN'), updateAIConfig);
router.get('/security-policies', getSecurityPolicies);
router.patch('/security-policies', updateSecurityPolicies);
router.get('/integrations', getIntegrations);
router.post('/integrations', createIntegration);
router.patch('/integrations/:id/status', updateIntegrationStatus);
router.post('/integrations/sync', triggerIntegrationSync);
router.post('/integrations/hris/sync', syncHrisDirectory);
router.post('/integrations/lms/sync', syncLmsCatalog);
router.get('/audit-logs', getAuditLogs);

export default router;
