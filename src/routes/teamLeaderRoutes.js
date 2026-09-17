import express from 'express';
import {
  getTeamSkillOverview,
  getTeamSkillGaps,
  getTeamReadinessScore,
  assignTraining,
  createProjectSquadRequest,
  getMemberProfileDetail,
  getAssignLearningData,
  getTeamPerformanceData,
  getTeamTrainingRequests,
  updateTrainingRequestStatus,
  batchApproveTrainingRequests
} from '../controllers/teamLeaderController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole('TEAM_LEADER', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'));

router.get('/overview', getTeamSkillOverview);
router.get('/gaps', getTeamSkillGaps);
router.get('/readiness', getTeamReadinessScore);
router.get('/members', getTeamSkillOverview);
router.get('/members/:id', getMemberProfileDetail);
router.get('/assign-learning-data', getAssignLearningData);
router.get('/performance', getTeamPerformanceData);
router.get('/skill-matrix', getTeamSkillOverview);
router.get('/reports', getTeamReadinessScore);
router.get('/training-requests', getTeamTrainingRequests);
router.patch('/training-requests/:id/status', updateTrainingRequestStatus);
router.post('/training-requests/batch-approve', batchApproveTrainingRequests);
router.post('/assign-training', assignTraining);
router.post('/projects', createProjectSquadRequest);

export default router;
