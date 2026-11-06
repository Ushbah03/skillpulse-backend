import express from 'express';
import { login, register, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { handleGoogleSSO } from '../controllers/ssoController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/google-sso', authLimiter, handleGoogleSSO);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', authenticateJWT, getMe);

export default router;
