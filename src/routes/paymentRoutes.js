import express from 'express';
import { createCheckoutSession, handleStripeWebhook, verifyCheckoutSession } from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook must be raw body, handled in server.js
// router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

router.post('/create-checkout-session', authenticateJWT, createCheckoutSession);
router.get('/verify', authenticateJWT, verifyCheckoutSession);

export default router;
