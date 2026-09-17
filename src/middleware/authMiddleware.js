import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillpulse_ai_super_secret_enterprise_jwt_key_2026');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, plan: true, status: true }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'User session is invalid or inactive.' });
    }

    if (user.role !== 'SUPER_ADMIN' && user.tenant && user.tenant.status === 'SUSPENDED') {
      return res.status(403).json({ 
        success: false, 
        message: `Your organization workspace (${user.tenant.name}) is currently suspended. Access denied.`,
        isSuspended: true,
        tenantName: user.tenant.name
      });
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: error.message });
  }
};
