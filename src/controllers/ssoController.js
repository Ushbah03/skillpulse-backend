import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const handleGoogleSSO = async (req, res, next) => {
  try {
    const { credential, tenantSlug, isNewWorkspace, organizationName, role, plan } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required.' });
    }

    // Step 1: Verify Google Access Token and fetch user profile
    let googlePayload;
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
      });
      
      if (!userInfoRes.ok) {
        throw new Error(`Google API returned ${userInfoRes.status}`);
      }
      
      googlePayload = await userInfoRes.json();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired Google token. Please try again.' });
    }

    const { email, given_name, family_name, picture, sub: googleId } = googlePayload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Step 2: Find existing user globally
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { tenant: true }
    });

    const isNewUser = !user;
    let tenant;

    if (user) {
      if (isNewWorkspace) {
        return res.status(409).json({ success: false, message: 'This email is already registered. You cannot create a new workspace with it.' });
      }
      
      // If a specific workspace was requested, verify it matches
      if (tenantSlug && user.tenant.slug !== tenantSlug) {
        return res.status(403).json({ success: false, message: 'This email belongs to another workspace. You cannot join this workspace.' });
      }
      
      tenant = user.tenant;
    } else {
      // User doesn't exist. This is a NEW signup (either create workspace or join workspace)
      if (!isNewWorkspace && !tenantSlug) {
        return res.status(404).json({ 
          success: false, 
          message: 'No account found with this Google email. Please Sign Up first.' 
        });
      }

      if (isNewWorkspace) {
        if (!organizationName || !tenantSlug) {
          return res.status(400).json({ success: false, message: 'Organization Name and Workspace Subdomain are required for new workspace.' });
        }
        const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        if (existingTenant) {
          return res.status(409).json({ success: false, message: 'Workspace subdomain already in use.' });
        }

        tenant = await prisma.tenant.create({
          data: {
            name: organizationName,
            slug: tenantSlug,
            domain: `${tenantSlug}.skillpulse-ai.com`,
            plan: plan ? plan.toUpperCase() : 'STARTER',
            status: 'PENDING_PAYMENT'
          }
        });
      } else {
        // Joining existing workspace
        if (tenantSlug) {
          tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        }
        if (!tenant) {
          return res.status(400).json({ success: false, message: 'Please provide a valid Workspace Subdomain to join.' });
        }
      }

      // Create the user
      const defaultRole = role || 'EMPLOYEE';
      
      // Enforce plan limits on roles
      if (!isNewWorkspace && tenant.plan === 'STARTER' && (defaultRole === 'TEAM_LEADER' || defaultRole === 'HR_MANAGER')) {
        return res.status(403).json({ 
          success: false, 
          message: `The ${tenant.name} workspace is on the STARTER plan, which does not support the ${defaultRole.replace('_', ' ')} role. Please request the Employee role.` 
        });
      }

      const defaultStatus = isNewWorkspace ? 'ACTIVE' : 'PENDING_INVITE';
      const actualRole = isNewWorkspace ? 'COMPANY_ADMIN' : defaultRole;

      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: cleanEmail,
          passwordHash: 'GOOGLE_SSO_AUTHENTICATED',
          firstName: given_name || cleanEmail.split('@')[0],
          lastName: family_name || 'User',
          avatarUrl: picture || null,
          role: actualRole,
          status: defaultStatus,
          ssoProvider: 'google',
          ssoId: googleId
        }
      });

      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'USER_PROVISIONED_VIA_SSO',
          resource: 'User',
          resourceId: user.id,
          details: { ssoProvider: 'google', email: cleanEmail, googleId }
        }
      }).catch(() => {});
      
      // Update avatar if changed on Google side for existing users? 
      // Actually, since we are inside 'if (!user) else', this block was meant for existing users.
      // Wait, in the current structure:
      // if (user) { ... tenant = user.tenant; } else { ... created user }
      // The update avatar logic belongs in the 'if (user)' block!
      // Let's just remove it here and we'll put it in the correct place later if needed.
    }

    // Update avatar for existing users
    if (!isNewUser && picture && user.avatarUrl !== picture) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: picture, ssoProvider: 'google', ssoId: googleId }
      }).catch(() => {});
    }

    // Step 4: Issue JWT token
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    // Fetch full user with tenant for response
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } } }
    });

    res.json({
      success: true,
      message: isNewUser
        ? 'Google SSO: New account provisioned. Awaiting admin approval.'
        : 'Google SSO Authentication successful.',
      token,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        role: fullUser.role,
        status: fullUser.status,
        tenantId: fullUser.tenantId,
        avatarUrl: fullUser.avatarUrl,
        tenant: fullUser.tenant
      }
    });
  } catch (error) {
    next(error);
  }
};
