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
