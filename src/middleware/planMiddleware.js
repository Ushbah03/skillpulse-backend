export const requirePlan = (minimumPlan) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const planHierarchy = {
      'STARTER': 1,
      'PRO': 2,
      'ENTERPRISE': 3
    };

    const userPlan = req.user?.tenant?.plan || 'STARTER';
    
    const userPlanLevel = planHierarchy[userPlan] || 1;
    const requiredLevel = planHierarchy[minimumPlan] || 1;

    if (userPlanLevel < requiredLevel) {
      return res.status(403).json({ 
        success: false, 
        message: `Your current plan (${userPlan}) does not include this feature. Upgrade to ${minimumPlan} or higher.`,
        code: 'UPGRADE_REQUIRED'
      });
    }

    next();
  };
};
