import express from 'express';
import { login, register, getMe } from '../controllers/authController.js';
import { handleGoogleSSO } from '../controllers/ssoController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google-sso', handleGoogleSSO);
router.get('/me', authenticateJWT, getMe);

export default router;
