import express from 'express';
import { inferSkillGaps, matchSquadForProject } from '../controllers/aiController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/infer-gaps', inferSkillGaps);
router.post('/match-squad', matchSquadForProject);

export default router;
