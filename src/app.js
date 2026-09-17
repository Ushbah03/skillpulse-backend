import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import teamLeaderRoutes from './routes/teamLeaderRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { handleStripeWebhook } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Stripe Webhook MUST be registered before express.json() to get the raw body
app.post('/api/payment/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

app.use(express.json());
app.use(morgan('dev'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SkillPulse AI Backend API',
    status: 'ONLINE',
    documentation: '/api/health',
    version: '1.0.0'
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    platform: 'SkillPulse AI SaaS Platform API',
    status: 'ONLINE',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes Layer
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/team-leader', teamLeaderRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
