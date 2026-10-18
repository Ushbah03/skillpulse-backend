import prisma from '../config/db.js';

/**
 * Fetch tenant security policies from SystemParameter table
 */
export const getTenantSecurityPolicies = async (tenantId) => {
  if (!tenantId) return null;
  try {
    const params = await prisma.systemParameter.findMany({
      where: { tenantId }
    });
    const policyMap = {};
    params.forEach(p => {
      policyMap[p.key] = p.value;
    });

    return {
      ssoEnforced: policyMap.ssoEnforced === 'true',
      mfaRequirement: policyMap.mfaRequirement || 'optional',
      sessionTimeout: parseInt(policyMap.sessionTimeout || '60'),
      ipWhitelistingEnabled: policyMap.ipWhitelistingEnabled === 'true',
      whitelistedIPs: policyMap.whitelistedIPs || '',
      passwordMinLength: parseInt(policyMap.passwordMinLength || '8'),
      requireSpecialChar: policyMap.requireSpecialChar !== undefined ? policyMap.requireSpecialChar === 'true' : true,
      auditLogRetentionDays: parseInt(policyMap.auditLogRetentionDays || '90')
    };
  } catch (err) {
    console.error('Error fetching tenant security policies:', err);
    return null;
  }
};

/**
 * Validate password against tenant complexity rules
 */
export const validatePasswordPolicy = async (password, tenantId) => {
  if (!password) return 'Password is required.';
  if (!tenantId) {
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    return null;
  }

  const policies = await getTenantSecurityPolicies(tenantId);
  if (!policies) {
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    return null;
  }

  const minLength = policies.passwordMinLength || 8;
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long as required by your organization's security policy.`;
  }

  if (policies.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>0-9]/.test(password)) {
    return `Password must include at least one number or special character as required by your organization's security policy.`;
  }

  return null;
};

/**
 * Check if IP is allowed based on corporate whitelisting
 */
export const checkIpWhitelisting = (rawClientIp, whitelistedIPs) => {
  if (!whitelistedIPs || !whitelistedIPs.trim()) return true;

  const clientIp = (rawClientIp || '').split(',')[0].trim().replace(/^::ffff:/, '');
  
  // Always permit local development environments
  if (['127.0.0.1', '::1', 'localhost'].includes(clientIp)) return true;

  const allowedList = whitelistedIPs.split(',').map(s => s.trim()).filter(Boolean);
  if (allowedList.length === 0) return true;

  return allowedList.some(allowed => {
    if (allowed.includes('/')) {
      const prefix = allowed.split('/')[0].split('.').slice(0, 3).join('.');
      return clientIp.startsWith(prefix);
    }
    return clientIp === allowed;
  });
};
