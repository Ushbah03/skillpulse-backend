import express from 'express';
import { createCheckoutSession, handleStripeWebhook, verifyCheckoutSession, completeSimulatedCheckout } from '../controllers/paymentController.js';

const router = express.Router();

// Webhook must be raw body, handled in server.js
// router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

router.post('/create-checkout-session', createCheckoutSession);
router.post('/complete-simulated-checkout', completeSimulatedCheckout);
router.get('/verify', verifyCheckoutSession);

export default router;
