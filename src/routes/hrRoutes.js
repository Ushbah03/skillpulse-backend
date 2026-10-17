import express from 'express';
import {
  getOrganizationSkillAnalytics,
  getWorkforceForecast,
  reallocateHeadcount,
  syncRecruitment,
  approveHiringPlan,
  getSuccessionPipelines,
  getComplianceStatus,
  getTrainingPrograms,
  createCourse
} from '../controllers/hrController.js';
import {
  getTeamTrainingRequests,
  updateTrainingRequestStatus,
  batchApproveTrainingRequests,
  assignTraining
} from '../controllers/teamLeaderController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole('HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'));

router.get('/analytics', getOrganizationSkillAnalytics);
router.get('/forecast', getWorkforceForecast);
router.post('/reallocate-headcount', reallocateHeadcount);
router.post('/sync-recruitment', syncRecruitment);
router.post('/approve-hiring-plan', approveHiringPlan);
router.get('/succession', getSuccessionPipelines);
router.get('/compliance', getComplianceStatus);
router.get('/training', getTrainingPrograms);
router.post('/courses', createCourse);
router.get('/training-requests', getTeamTrainingRequests);
router.patch('/training-requests/:id/status', updateTrainingRequestStatus);
router.post('/training-requests/batch-approve', batchApproveTrainingRequests);
router.post('/assign-training', assignTraining);

export default router;
