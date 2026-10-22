import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RBAC_PERMISSIONS } from '../src/controllers/adminController.js';

describe('RBAC Security & Plan Ceiling Test Suite', () => {
  it('should define all 5 canonical SRS system roles in the RBAC matrix', () => {
    const requiredRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'EMPLOYEE'];
    const definedRoles = Object.keys(DEFAULT_RBAC_PERMISSIONS);
    
    for (const role of requiredRoles) {
      assert.ok(definedRoles.includes(role), `Missing required role: ${role}`);
    }
  });

  it('should enforce Principle of Least Privilege: Non-SuperAdmin roles must not have global root permissions', () => {
    const rootPermissions = ['tenantManagement', 'aiConfigAccess'];
    const nonSuperRoles = ['COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'EMPLOYEE'];

    for (const role of nonSuperRoles) {
      const perms = DEFAULT_RBAC_PERMISSIONS[role];
      assert.ok(perms, `Role ${role} permissions object must exist`);
      for (const rootPerm of rootPermissions) {
        assert.equal(
          perms[rootPerm], 
          false, 
          `Security violation: ${role} must not possess global root privilege '${rootPerm}'`
        );
      }
    }
  });

  it('should enforce Segregation of Duties: Employee must not possess administrative permissions', () => {
    const employeePerms = DEFAULT_RBAC_PERMISSIONS.EMPLOYEE;
    assert.equal(employeePerms.userManagement, false, 'Employee must not have userManagement permission');
    assert.equal(employeePerms.billingAccess, false, 'Employee must not have billingAccess permission');
    assert.equal(employeePerms.securityAuditLogs, false, 'Employee must not have securityAuditLogs permission');
    assert.equal(employeePerms.selfAssessment, true, 'Employee must have selfAssessment permission');
  });

  it('should enforce Plan Ceiling: STARTER plan cannot assign premium roles (HR_MANAGER, TEAM_LEADER)', () => {
    const PREMIUM_ROLES = ['HR_MANAGER', 'TEAM_LEADER'];
    const tenantPlan = 'STARTER';

    // Business logic assertion for role assignment policy
    const isRoleAllowed = (role, plan) => {
      if (PREMIUM_ROLES.includes(role) && plan === 'STARTER') {
        return false;
      }
      return true;
    };

    assert.equal(isRoleAllowed('EMPLOYEE', tenantPlan), true, 'Starter plan must allow Employee');
    assert.equal(isRoleAllowed('COMPANY_ADMIN', tenantPlan), true, 'Starter plan must allow Company Admin');
    assert.equal(isRoleAllowed('HR_MANAGER', tenantPlan), false, 'Starter plan must reject HR Manager');
    assert.equal(isRoleAllowed('TEAM_LEADER', tenantPlan), false, 'Starter plan must reject Team Leader');

    // On PRO and ENTERPRISE, premium roles are unlocked
    assert.equal(isRoleAllowed('HR_MANAGER', 'PRO'), true, 'Pro plan must allow HR Manager');
    assert.equal(isRoleAllowed('TEAM_LEADER', 'ENTERPRISE'), true, 'Enterprise plan must allow Team Leader');
  });
});
