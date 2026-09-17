import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const login = async (req, res, next) => {
  try {
    const { email, password, workspace } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let whereClause = { email: email.toLowerCase().trim() };
    
    // If user provided a workspace, find that tenant first
    if (workspace) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: workspace.toLowerCase().trim() }
      });
      if (tenant) {
        whereClause.tenantId = tenant.id;
      }
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, plan: true, status: true, logoUrl: true }
        },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        isAccountSuspended: true,
        status: 'INACTIVE',
        message: 'Your personal user account has been deactivated by your administrator.',
        email: user.email,
        tenantName: user.tenant?.name || 'Your Organization'
      });
    }

    if (user.status === 'PENDING_INVITE') {
      return res.status(403).json({ 
        success: false, 
        isPendingApproval: true,
        status: 'PENDING_INVITE',
        message: 'Your account is pending admin approval.',
        email: user.email,
        tenantName: user.tenant?.name || 'Your Organization'
      });
    }

    // Note: Suspended tenant check is handled gracefully by frontend redirect to /workspace-suspended page and protected route guard.

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'skillpulse_ai_super_secret_enterprise_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Record login in audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        details: { email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        jobTitle: user.jobTitle,
        avatarUrl: user.avatarUrl,
        tenant: user.tenant,
        department: user.department,
        team: user.team
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, tenantSlug, organizationName, isNewWorkspace, role = 'EMPLOYEE', jobTitle } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
    }

    let tenant = null;

    if (isNewWorkspace) {
      if (!organizationName || !tenantSlug) {
        return res.status(400).json({ success: false, message: 'Organization name and subdomain are required for new workspaces.' });
      }

      // Check if tenant slug already exists
      const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (existingTenant) {
        if (existingTenant.status === 'PENDING_PAYMENT') {
          // If it was an abandoned payment attempt, we can safely delete it and start fresh
          await prisma.tenant.delete({ where: { id: existingTenant.id } });
        } else {
          return res.status(409).json({ success: false, message: 'Workspace subdomain is already taken. Please choose another.' });
        }
      }

      // Create new tenant in PENDING_PAYMENT state
      tenant = await prisma.tenant.create({
        data: {
          name: organizationName,
          slug: tenantSlug,
          plan: 'STARTER',
          maxUsers: 30,
          status: 'PENDING_PAYMENT',
        }
      });
    } else {
      if (tenantSlug) {
        tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      } else {
        tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
      }

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Workspace not found. Check your invite code or subdomain.' });
      }

      // Enforce plan limits on roles
      if (!isNewWorkspace && tenant.plan === 'STARTER' && (role === 'TEAM_LEADER' || role === 'HR_MANAGER')) {
        return res.status(403).json({ 
          success: false, 
          message: `The ${tenant.name} workspace is on the STARTER plan, which does not support the ${role.replace('_', ' ')} role. Please request the Employee role.` 
        });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This email is already registered in the system. You cannot create another account with it.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        role: isNewWorkspace ? 'COMPANY_ADMIN' : role,
        jobTitle: jobTitle || (isNewWorkspace ? 'Company Admin' : 'Employee'),
        // New workspace admins are ACTIVE immediately; joiners wait for approval
        status: isNewWorkspace ? 'ACTIVE' : 'PENDING_INVITE'
      }
    });

    newUser.tenant = tenant;

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: newUser.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: newUser.id,
        details: { email: newUser.email, role: newUser.role, isNewWorkspace },
        ipAddress: req.ip
      }
    });

    const token = jwt.sign(
      {
        userId: newUser.id,
        tenantId: newUser.tenantId,
        role: newUser.role,
        email: newUser.email
      },
      process.env.JWT_SECRET || 'skillpulse_ai_super_secret_enterprise_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: isNewWorkspace ? 'Workspace and admin account created successfully.' : 'Registration successful! Your account is pending admin approval.',
      token,
      isPendingApproval: !isNewWorkspace, // Signal to frontend to show approval wall
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        status: newUser.status,
        tenant: newUser.tenant
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        tenant: { select: { id: true, name: true, slug: true, plan: true, domain: true, logoUrl: true } },
        department: true,
        team: true,
        skills: {
          include: { skill: { include: { category: true } } }
        },
        skillGaps: {
          include: { skill: true, assignedCourse: true }
        },
        enrollments: {
          include: { course: true }
        }
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
