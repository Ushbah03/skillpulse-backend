import express from 'express';
import {
  getMySkillProfile,
  addOrUpdateSkill,
  deleteUserSkill,
  getMySkillGaps,
  getMyLearningRecommendations,
  enrollCourse,
  updateCourseProgress,
  getMyAssessments,
  getAIQuestionsForAssessment,
  submitAssessment,
  getCareerPaths
} from '../controllers/employeeController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/profile', getMySkillProfile);
router.post('/skills', addOrUpdateSkill);
router.delete('/skills/:userSkillId', deleteUserSkill);
router.get('/gaps', getMySkillGaps);
router.get('/learning', getMyLearningRecommendations);
router.post('/enroll', enrollCourse);
router.post('/progress', updateCourseProgress);
router.get('/assessments', getMyAssessments);
router.post('/assessments/generate-questions', getAIQuestionsForAssessment);
router.post('/assessments', submitAssessment);
router.get('/career-paths', getCareerPaths);

export default router;
