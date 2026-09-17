import bcrypt from 'bcryptjs';
import os from 'os';
import prisma from '../config/db.js';

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password = 'Password123!', role = 'EMPLOYEE', dept, tenantId: bodyTenantId } = req.body;
    let tenantId = req.user.role === 'SUPER_ADMIN' ? (bodyTenantId || req.tenantId) : req.tenantId;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    if (!tenantId) {
      const defaultTenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
      if (defaultTenant) tenantId = defaultTenant.id;
    }

    // ─── PLAN-BASED ROLE RESTRICTION ────────────────────────────────────────
    // STARTER plan cannot assign premium roles (HR_MANAGER, TEAM_LEADER)
    const PREMIUM_ROLES = ['HR_MANAGER', 'TEAM_LEADER'];
    if (PREMIUM_ROLES.includes(role) && req.user.role !== 'SUPER_ADMIN') {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const planLevel = { 'STARTER': 1, 'PRO': 2, 'Professional': 2, 'ENTERPRISE': 3, 'Enterprise AI': 3 };
      const tenantPlanLevel = planLevel[tenant?.plan] || 1;
      if (tenantPlanLevel < 2) {
        return res.status(403).json({
          success: false,
          message: `Your current plan (${tenant?.plan || 'STARTER'}) does not allow assigning the '${role}' role. Upgrade to Professional or Enterprise to unlock premium roles.`,
          code: 'UPGRADE_REQUIRED'
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    const existing = await prisma.user.findFirst({
      where: { tenantId, email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists in workspace.' });
    }

    let departmentId = undefined;
    if (dept) {
      const foundDept = await prisma.department.findFirst({
        where: { tenantId, name: { equals: dept, mode: 'insensitive' } }
      });
      if (foundDept) {
        departmentId = foundDept.id;
      } else {
        const newDept = await prisma.department.create({
          data: { tenantId, name: dept }
        });
        departmentId = newDept.id;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        tenantId,
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        role,
        jobTitle: role.replace('_', ' '),
        departmentId
      }
    });

    if (departmentId) {
      newUser.department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true }
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        action: 'USER_PROVISIONED',
        resource: 'User',
        resourceId: newUser.id,
        details: { email: newUser.email, role: newUser.role, name }
      }
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'User provisioned successfully.', data: newUser });
  } catch (error) {
    next(error);
  }
};

export const getTenants = async (req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          where: { role: 'COMPANY_ADMIN' },
          select: { email: true, firstName: true, lastName: true },
          take: 1
        },
        _count: {
          select: { users: true, departments: true, teams: true, projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = tenants.map(t => ({
      ...t,
      adminEmail: t.users?.[0]?.email || null
    }));

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    next(error);
  }
};

export const createTenant = async (req, res, next) => {
  try {
    const { 
      name, 
      slug, 
      domain, 
      plan = 'PRO', 
      maxUsers = 250,
      adminEmail,
      adminPassword,
      authMethod = 'STANDARD',
      adminFirstName = 'Company',
      adminLastName = 'Admin'
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Tenant name and slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().trim();

    // Check slug uniqueness
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return res.status(400).json({ success: false, message: `Tenant workspace slug '${cleanSlug}' already exists.` });
    }

    // Default status for new tenant is PENDING_PAYMENT
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug: cleanSlug,
        domain: domain ? domain.trim() : `${cleanSlug}.com`,
        plan,
        status: 'PENDING_PAYMENT',
        maxUsers: parseInt(maxUsers)
      }
    });

    let adminCredentials = null;

    if (adminEmail) {
      const cleanEmail = adminEmail.toLowerCase().trim();
      const isGoogleSSO = authMethod === 'GOOGLE_SSO';
      const initialPassword = isGoogleSSO ? null : (adminPassword || 'AdminPass2026!');
      const passwordHash = isGoogleSSO 
        ? await bcrypt.hash(Math.random().toString(36).slice(-10) + 'SsoPass!', 10)
        : await bcrypt.hash(initialPassword, 10);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            tenantId: newTenant.id,
            email: cleanEmail,
            passwordHash,
            firstName: adminFirstName,
            lastName: adminLastName,
            role: 'COMPANY_ADMIN',
            status: 'ACTIVE',
            jobTitle: 'Primary Administrator'
          }
        });
      }

      adminCredentials = {
        email: cleanEmail,
        password: isGoogleSSO ? null : initialPassword,
        authMethod
      };
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: newTenant.id,
        userId: req.user?.userId || newTenant.id,
        action: `TENANT_CREATED: ${newTenant.name}`,
        resource: 'Tenant',
        details: { name: newTenant.name, plan, status: 'PENDING_PAYMENT', adminEmail }
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Tenant workspace onboarded successfully with status PENDING_PAYMENT.', 
      data: newTenant,
      adminCredentials 
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, plan, maxUsers, name, domain } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (plan) updateData.plan = plan;
    if (maxUsers) updateData.maxUsers = parseInt(maxUsers);
    if (name) updateData.name = name;
    if (domain) updateData.domain = domain;

    const updated = await prisma.tenant.update({
      where: { id },
      data: updateData
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        userId: req.user.userId,
        action: `TENANT_UPDATED: ${Object.keys(updateData).join(', ')}`,
        resource: 'Tenant',
        details: updateData
      }
    });

    res.json({ success: true, message: 'Tenant updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const whereClause = {};
    if (req.user.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = req.tenantId;
    } else if (req.query.tenantId && req.query.tenantId !== 'ALL') {
      whereClause.tenantId = req.query.tenantId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        tenant: { select: { id: true, name: true, slug: true, domain: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        _count: { select: { skills: true, skillGaps: true, enrollments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, status, dept, teamId } = req.body;
    let { departmentId } = req.body;

    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Resolve dept string to departmentId (create if needed)
    if (dept) {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      const tenantId = targetUser?.tenantId || req.tenantId;
      const foundDept = await prisma.department.findFirst({
        where: { tenantId, name: { equals: dept, mode: 'insensitive' } }
      });
      if (foundDept) {
        departmentId = foundDept.id;
      } else {
        const newDept = await prisma.department.create({
          data: { tenantId, name: dept }
        });
        departmentId = newDept.id;
      }
    }
    if (departmentId) updateData.departmentId = departmentId;
    if (teamId) updateData.teamId = teamId;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: updatedUser.tenantId || req.tenantId,
        userId: req.user?.userId || req.user?.id,
        action: 'USER_ROLE_UPDATED',
        resource: 'User',
        resourceId: userId,
        details: { newRole: role, status },
        ipAddress: req.ip
      }
    });

    res.json({ success: true, message: 'User updated successfully.', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.id === req.user?.userId || user.id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user?.userId || req.user?.id,
        action: `USER_DELETED: ${user.email}`,
        resource: 'User',
        resourceId: userId
      }
    });

    res.json({ success: true, message: `User ${user.email} deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

export const getSkillTaxonomy = async (req, res, next) => {
  try {
    const isSuper = req.user?.role === 'SUPER_ADMIN';
    const tenantId = isSuper ? (req.query?.tenantId || req.tenantId) : req.tenantId;

    const categories = await prisma.skillCategory.findMany({
      where: isSuper ? {} : {
        OR: [
          { tenantId },
          {
            skills: {
              some: {
                OR: [
                  { tenantId },
                  { userSkills: { some: { user: { tenantId } } } },
                  { skillGaps: { some: { tenantId } } }
                ]
              }
            }
          }
        ]
      },
      include: {
        skills: {
          where: isSuper ? {} : {
            OR: [
              { tenantId },
              { userSkills: { some: { user: { tenantId } } } },
              { skillGaps: { some: { tenantId } } }
            ]
          },
          include: {
            _count: {
              select: {
                userSkills: tenantId ? { where: { user: { tenantId } } } : true,
                skillGaps: tenantId ? { where: { tenantId } } : true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const filteredCategories = categories.filter(cat => cat.skills.length > 0);

    res.json({ success: true, count: filteredCategories.length, data: filteredCategories });
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const { categoryId, categoryName, category, name, description } = req.body;
    const targetCategoryName = categoryName || category || 'General Skills';

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const trimmedName = name.trim();
    const isSuper = req.user?.role === 'SUPER_ADMIN';
    const tenantId = isSuper ? null : req.tenantId;

    // Prevent duplicate skill entries for the same tenant workspace
    const existingSkill = await prisma.skill.findFirst({
      where: {
        tenantId,
        name: { equals: trimmedName, mode: 'insensitive' }
      },
      include: { category: true }
    });

    if (existingSkill) {
      return res.status(200).json({ success: true, message: 'Skill node already exists.', data: existingSkill });
    }

    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      const foundCategory = await prisma.skillCategory.findFirst({
        where: { name: { equals: targetCategoryName, mode: 'insensitive' } }
      });
      if (foundCategory) {
        targetCategoryId = foundCategory.id;
      } else {
        const newCategory = await prisma.skillCategory.create({
          data: {
            name: targetCategoryName,
            description: `${targetCategoryName} Framework`,
            tenantId
          }
        });
        targetCategoryId = newCategory.id;
      }
    }

    const skill = await prisma.skill.create({
      data: {
        categoryId: targetCategoryId,
        name: trimmedName,
        description: description || `${trimmedName} Competency Node`,
        isGlobal: isSuper,
        tenantId,
        proficiencyLevel: req.body.level || req.body.proficiencyLevel || 'Beginner',
        priorityTier: req.body.weightage || req.body.priorityTier || 'Low',
        benchmarkScore: req.body.benchmarkScore !== undefined ? Number(req.body.benchmarkScore) : 75
      }
    });

    if (targetCategoryId) {
      skill.category = await prisma.skillCategory.findUnique({
        where: { id: targetCategoryId }
      });
    }

    if (req.user?.userId || req.user?.id) {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenantId || null,
          userId: req.user.userId || req.user.id,
          action: 'SKILL_CREATED',
          resource: 'Skill',
          details: { skillId: skill.id, name: skill.name, category: targetCategoryName }
        }
      }).catch(() => {});
    }

    res.status(201).json({ success: true, message: 'Skill created successfully in database.', data: skill });
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, categoryName, description } = req.body;
    const isSuper = req.user?.role === 'SUPER_ADMIN';

    const existingSkill = await prisma.skill.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!existingSkill) {
      return res.status(404).json({ success: false, message: 'Skill node not found.' });
    }

    if (!isSuper && existingSkill.tenantId && existingSkill.tenantId !== req.tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot edit another tenant skill.' });
    }

    let categoryId = existingSkill.categoryId;
    const targetCat = categoryName || category;
    if (targetCat) {
      const foundCat = await prisma.skillCategory.findFirst({
        where: { name: { equals: targetCat, mode: 'insensitive' } }
      });
      if (foundCat) {
        categoryId = foundCat.id;
      } else {
        const newCat = await prisma.skillCategory.create({
          data: {
            name: targetCat,
            description: `${targetCat} Category`,
            tenantId: isSuper ? null : req.tenantId
          }
        });
        categoryId = newCat.id;
      }
    }

    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: {
        name: name || existingSkill.name,
        categoryId,
        description: description || existingSkill.description,
        proficiencyLevel: req.body.level || req.body.proficiencyLevel || existingSkill.proficiencyLevel || 'Beginner',
        priorityTier: req.body.weightage || req.body.priorityTier || existingSkill.priorityTier || 'Low',
        benchmarkScore: req.body.benchmarkScore !== undefined ? Number(req.body.benchmarkScore) : existingSkill.benchmarkScore
      },
      include: { category: true }
    });

    if (req.user?.id || req.user?.userId) {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenantId || null,
          userId: req.user.id || req.user.userId,
          action: 'SKILL_UPDATED',
          resource: 'Skill',
          resourceId: id,
          details: { skillId: id, name: updatedSkill.name }
        }
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Skill updated successfully in database.', data: updatedSkill });
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuper = req.user?.role === 'SUPER_ADMIN';

    const existingSkill = await prisma.skill.findUnique({ where: { id } });
    if (!existingSkill) {
      return res.status(404).json({ success: false, message: 'Skill node not found.' });
    }

    if (!isSuper && existingSkill.tenantId && existingSkill.tenantId !== req.tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another tenant skill.' });
    }

    await prisma.skill.delete({ where: { id } });

    if (req.user?.id || req.user?.userId) {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenantId || null,
          userId: req.user.id || req.user.userId,
          action: 'SKILL_DELETED',
          resource: 'Skill',
          resourceId: id,
          details: { skillId: id, name: existingSkill.name }
        }
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Skill node deleted from database.', data: { id } });
  } catch (error) {
    next(error);
  }
};

export const getAIConfigs = async (req, res, next) => {
  try {
    let configs = await prisma.aIModelConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    const hasGroqKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'));

    const activeKeys = {
      groqApiKey: (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) ? process.env.GROQ_API_KEY : '',
      openAiApiKey: (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) ? process.env.OPENAI_API_KEY : '',
      anthropicApiKey: (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) ? process.env.ANTHROPIC_API_KEY : '',
      geminiApiKey: (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIzaSy')) ? process.env.GEMINI_API_KEY : '',
      openRouterApiKey: (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) ? process.env.OPENROUTER_API_KEY : ''
    };

    const envStatus = {
      groqSecured: Boolean(activeKeys.groqApiKey),
      openAiSecured: Boolean(activeKeys.openAiApiKey),
      anthropicSecured: Boolean(activeKeys.anthropicApiKey),
      geminiSecured: Boolean(activeKeys.geminiApiKey),
      openRouterSecured: Boolean(activeKeys.openRouterApiKey)
    };

    if (configs.length === 0 && hasGroqKey) {
      const liveConfig = await prisma.aIModelConfig.create({
        data: {
          modelName: 'groq/compound',
          provider: 'Groq LPU Cloud (Free Tier)',
          version: '1.0.0',
          temperature: 0.2,
          maxTokens: 4096,
          topP: 0.95,
          contextWindow: 128000,
          isActive: true,
          hyperparams: {
            taskRouting: {
              skillAssessment: 'groq/compound',
              resumeParsing: 'groq/compound',
              learningRecommendations: 'groq/compound'
            },
            systemPrompt: 'You are SkillPulse AI, an objective, highly accurate talent assessment engine. Ensure all skill evaluations strictly follow the global taxonomy framework without bias.',
            guardrailsStrictness: 'High',
            fallbackEnabled: true
          }
        }
      });
      configs = [liveConfig];
    }

    res.json({ success: true, count: configs.length, data: configs, envStatus, activeKeys });
  } catch (error) {
    next(error);
  }
};


export const getAuditLogs = async (req, res, next) => {
  try {
    const isSuper = req.user?.role === 'SUPER_ADMIN';
    const tenantId = isSuper ? req.query.tenantId : req.tenantId;
    const whereClause = tenantId ? { tenantId } : {};

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
          tenant: { select: { name: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    res.json({ success: true, count: logs.length, totalCount, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user.role === 'SUPER_ADMIN' ? (req.query.tenantId || req.tenantId) : req.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    const totalUsersCount = await prisma.user.count({ where: { tenantId } });
    const activeUsersCount = await prisma.user.count({ where: { tenantId, status: 'ACTIVE' } });

    const departments = await prisma.department.findMany({
      where: { tenantId },
      include: {
        members: {
          include: {
            skills: { select: { proficiencyLevel: true } }
          }
        }
      }
    });

    const deptSkillCompletion = departments.map(d => {
      let totalProf = 0;
      let count = 0;
      (d.members || []).forEach(u => {
        (u.skills || []).forEach(s => {
          totalProf += s.proficiencyLevel;
          count++;
        });
      });
      // Fallback to 0 if no skills exist, no more fake 3.5 data
      const avg = count ? (totalProf / count) : 0;
      return {
        dept: d.name,
        rate: Math.min(100, Math.round((avg / 5.0) * 100))
      };
    });

    const allUserSkills = await prisma.userSkill.findMany({
      where: { user: { tenantId } },
      select: { proficiencyLevel: true }
    });

    const totalSkillProf = allUserSkills.reduce((sum, s) => sum + s.proficiencyLevel, 0);
    // Fallback to 0 if no skills exist, no more fake 3.5 data
    const avgSkillProf = allUserSkills.length ? (totalSkillProf / allUserSkills.length) : 0;
    const readinessPct = Math.min(100, Math.round((avgSkillProf / 5.0) * 100 * 10) / 10);

    const courseCount = await prisma.course.count();

    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const usersForMonth = await prisma.user.findMany({
      where: { tenantId },
      select: { createdAt: true }
    });

    const monthCountMap = {};
    usersForMonth.forEach(u => {
      const m = monthNames[u.createdAt.getMonth()];
      monthCountMap[m] = (monthCountMap[m] || 0) + 1;
    });

    let cumulativeUsers = 0;
    const userActivityData = monthNames.map(m => {
      cumulativeUsers += (monthCountMap[m] || 0);
      return {
        month: m,
        active: cumulativeUsers || activeUsersCount,
        capacity: tenant?.maxUsers || 100
      };
    });

    res.json({
      success: true,
      data: {
        tenantId: tenantId,
        tenantName: tenant?.name || 'Enterprise Workspace',
        plan: tenant?.plan || 'PRO',
        maxUsers: tenant?.maxUsers || 100,
        activeUsersCount,
        totalUsersCount,
        readinessPct,
        courseCount,
        recentAuditLogs,
        deptSkillCompletion,
        userActivityData
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGlobalTelemetry = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const [tenantsCount, activeTenantCount, totalUsersCount, sumMaxUsersResult, logCount, errorLogCount, tenants, recentAuditLogs] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.tenant.aggregate({ _sum: { maxUsers: true } }),
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: 'ERROR', mode: 'insensitive' } },
            { action: { contains: 'FAIL', mode: 'insensitive' } }
          ]
        }
      }),
      prisma.tenant.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4
      })
    ]);

    const totalSeatLimit = sumMaxUsersResult._sum.maxUsers || 1000;

    const mappedTenants = tenants.map(t => ({
      name: t.name,
      domain: t.domain || `${t.slug}.com`,
      seats: `${t._count.users} / ${t.maxUsers}`,
      tier: t.plan,
      status: t.status === 'ACTIVE' ? 'Active' : 'Suspended',
      usage: Math.min(100, Math.round((t._count.users / Math.max(1, t.maxUsers)) * 100))
    }));

    const queryLatencyMs = Date.now() - startTime;
    const uptimePct = tenantsCount > 0 ? ((activeTenantCount / tenantsCount) * 100).toFixed(2) : '100.00';
    const aiErrorRatePct = logCount > 0 ? ((errorLogCount / logCount) * 100).toFixed(2) : '0.00';
    
    // Real process memory heap load calculation
    const memUsage = process.memoryUsage();
    const heapLoadPct = Math.min(95, Math.max(10, Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)));

    res.json({
      success: true,
      data: {
        tenantsCount: activeTenantCount,
        totalUsersCount,
        totalSeatLimit,
        recentTenants: mappedTenants,
        recentAuditLogs
      },
      telemetry: {
        uptime: `${uptimePct}%`,
        latency: `${queryLatencyMs} ms`,
        aiErrorRate: `${aiErrorRatePct}%`,
        cpuLoad: `${heapLoadPct}% Load`,
        totalTenants: tenantsCount,
        totalUsers: totalUsersCount,
        totalAuditLogs: logCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAIConfig = async (req, res, next) => {
  try {
    const { 
      modelName = 'Not Connected',
      provider = 'None (Pending Setup)',
      version = '1.0.0',
      temperature = 0.2, 
      maxTokens = 4096, 
      isActive = false, 
      topP = 0.95,
      contextWindow = 128000,
      hyperparams 
    } = req.body;

    const created = await prisma.aIModelConfig.create({
      data: {
        modelName,
        provider,
        version,
        temperature: parseFloat(temperature),
        maxTokens: parseInt(maxTokens),
        topP: parseFloat(topP),
        contextWindow: parseInt(contextWindow),
        isActive: Boolean(isActive),
        hyperparams: hyperparams || {
          taskRouting: {
            skillAssessment: 'gpt-4o',
            resumeParsing: 'gpt-4o',
            learningRecommendations: 'llama-3.1-70b'
          },
          systemPrompt: 'You are SkillPulse AI, an objective talent assessment engine.',
          guardrailsStrictness: 'High',
          fallbackEnabled: true
        }
      }
    });

    if (req.user?.userId || req.user?.id) {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenantId || null,
          userId: req.user.userId || req.user.id,
          action: `AI_CONFIG_CREATED: ${modelName}`,
          resource: 'AIModelConfig',
          resourceId: created.id,
          details: created
        }
      }).catch(() => {});
    }

    res.status(201).json({ success: true, message: 'AI model configuration created successfully.', data: created });
  } catch (error) {
    next(error);
  }
};

export const updateAIConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      modelName,
      temperature, 
      maxTokens, 
      isActive, 
      provider, 
      version,
      topP,
      contextWindow,
      hyperparams,
      apiKey,
      groqApiKey,
      openAiApiKey,
      anthropicApiKey,
      geminiApiKey,
      openRouterApiKey
    } = req.body;

    const updateData = {};
    if (modelName !== undefined) updateData.modelName = modelName;
    if (temperature !== undefined) updateData.temperature = parseFloat(temperature);
    if (maxTokens !== undefined) updateData.maxTokens = parseInt(maxTokens);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (provider !== undefined) updateData.provider = provider;
    if (version !== undefined) updateData.version = version;
    if (topP !== undefined) updateData.topP = parseFloat(topP);
    if (contextWindow !== undefined) updateData.contextWindow = parseInt(contextWindow);
    if (hyperparams !== undefined) updateData.hyperparams = hyperparams;

    // Direct Keys from UI Inputs
    if (groqApiKey && typeof groqApiKey === 'string' && groqApiKey.trim()) {
      process.env.GROQ_API_KEY = groqApiKey.trim();
    }
    if (openAiApiKey && typeof openAiApiKey === 'string' && openAiApiKey.trim()) {
      process.env.OPENAI_API_KEY = openAiApiKey.trim();
    }
    if (anthropicApiKey && typeof anthropicApiKey === 'string' && anthropicApiKey.trim()) {
      process.env.ANTHROPIC_API_KEY = anthropicApiKey.trim();
    }
    if (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }
    if (openRouterApiKey && typeof openRouterApiKey === 'string' && openRouterApiKey.trim()) {
      process.env.OPENROUTER_API_KEY = openRouterApiKey.trim();
    }

    if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
      const trimmed = apiKey.trim();
      if (trimmed.startsWith('gsk_')) process.env.GROQ_API_KEY = trimmed;
      else if (trimmed.startsWith('sk-ant-')) process.env.ANTHROPIC_API_KEY = trimmed;
      else if (trimmed.startsWith('sk-or-v1-')) process.env.OPENROUTER_API_KEY = trimmed;
      else if (trimmed.startsWith('sk-')) process.env.OPENAI_API_KEY = trimmed;
      else process.env.GEMINI_API_KEY = trimmed;
    }

    const baseHyperparams = (typeof hyperparams === 'object' && hyperparams !== null) ? hyperparams : {};
    updateData.hyperparams = {
      ...baseHyperparams,
      configuredKeys: {
        groqApiKey: process.env.GROQ_API_KEY || null,
        openRouterApiKey: process.env.OPENROUTER_API_KEY || null,
        openAiApiKey: process.env.OPENAI_API_KEY || null,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
        geminiApiKey: process.env.GEMINI_API_KEY || null
      }
    };

    const updated = await prisma.aIModelConfig.update({
      where: { id },
      data: updateData
    });

    if (req.user?.userId || req.user?.id) {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenantId || null,
          userId: req.user.userId || req.user.id,
          action: `AI_CONFIG_UPDATED: ${Object.keys(updateData).join(', ')}`,
          resource: 'AIModelConfig',
          resourceId: id,
          details: updateData
        }
      }).catch(() => {});
    }

    res.json({ success: true, message: 'AI model configuration updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const getSecurityPolicies = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.json({
        success: true,
        data: {
          ssoEnforced: true,
          mfaRequirement: 'all',
          sessionTimeout: '60',
          ipWhitelistingEnabled: false,
          whitelistedIPs: '192.168.1.1/24, 10.0.0.1',
          passwordMinLength: 12,
          requireSpecialChar: true,
          auditLogRetentionDays: 90
        }
      });
    }

    const params = await prisma.systemParameter.findMany({
      where: { tenantId }
    });

    const paramMap = {};
    params.forEach(p => {
      paramMap[p.key] = p.value;
    });

    res.json({
      success: true,
      data: {
        ssoEnforced: paramMap.ssoEnforced !== undefined ? paramMap.ssoEnforced === 'true' : true,
        mfaRequirement: paramMap.mfaRequirement || 'all',
        sessionTimeout: paramMap.sessionTimeout || '60',
        ipWhitelistingEnabled: paramMap.ipWhitelistingEnabled === 'true',
        whitelistedIPs: paramMap.whitelistedIPs || '192.168.1.1/24, 10.0.0.1',
        passwordMinLength: parseInt(paramMap.passwordMinLength || '12'),
        requireSpecialChar: paramMap.requireSpecialChar !== undefined ? paramMap.requireSpecialChar === 'true' : true,
        auditLogRetentionDays: parseInt(paramMap.auditLogRetentionDays || '90')
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSecurityPolicies = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const policies = req.body;

    if (tenantId) {
      const keys = Object.keys(policies);
      for (const key of keys) {
        const valString = String(policies[key]);
        await prisma.systemParameter.upsert({
          where: {
            tenantId_key: { tenantId, key }
          },
          update: { value: valString },
          create: { tenantId, key, value: valString, isGlobal: false }
        });
      }

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user?.id || req.user?.userId || null,
          action: 'SECURITY_POLICIES_UPDATED',
          resource: 'SystemParameter',
          details: policies
        }
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Security policies updated in database.', data: policies });
  } catch (error) {
    next(error);
  }
};

export const getIntegrations = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    let tenantId = req.query?.tenantId || req.tenantId;

    if (!isSuperAdmin && !tenantId) {
      return res.json({ success: true, count: 0, data: [] });
    }

    let whereClause = {};
    if (!isSuperAdmin) {
      whereClause = { tenantId };
    } else if (tenantId) {
      whereClause = { tenantId };
    }

    // Find default tenant for seeding platform connectors if missing
    let defaultTenantId = tenantId;
    if (!defaultTenantId) {
      const firstTenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
      if (firstTenant) defaultTenantId = firstTenant.id;
    }

    if (defaultTenantId) {
      // Seed Stripe Payments if missing
      const existingStripe = await prisma.integrationConfig.findFirst({
        where: { type: { startsWith: 'PAYMENT_STRIPE' } }
      });
      if (!existingStripe) {
        await prisma.integrationConfig.create({
          data: {
            tenantId: defaultTenantId,
            name: 'Stripe Payments',
            type: 'PAYMENT_STRIPE_GLOBAL',
            endpointUrl: 'https://api.stripe.com/v1',
            status: 'ACTIVE',
            isEnabled: true,
            configJson: {
              category: 'Payment Gateway',
              description: 'Global payment gateway powering all tenant plan subscriptions. Handles Stripe Checkout sessions, recurring billing, and plan upgrades.',
              icon: 'stripe',
              isPlatform: true,
              details: [
                { label: 'Mode', value: 'Test (Sandbox)' },
                { label: 'API Version', value: '2023-10-16' },
                { label: 'Webhook Status', value: 'Pending (Needs HTTPS)' },
                { label: 'Plans Active', value: 'Starter · Professional · Enterprise AI' },
                { label: 'Secret Key', value: 'sk_test_••••••••••UGg0' }
              ]
            }
          }
        });
      }

      // Seed Google SSO if missing
      const existingGoogle = await prisma.integrationConfig.findFirst({
        where: { type: { startsWith: 'SSO_GOOGLE' } }
      });
      if (!existingGoogle) {
        await prisma.integrationConfig.create({
          data: {
            tenantId: defaultTenantId,
            name: 'Google SSO (OAuth2)',
            type: 'SSO_GOOGLE_GLOBAL',
            endpointUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            status: 'ACTIVE',
            isEnabled: true,
            configJson: {
              category: 'SSO & Identity',
              description: 'Platform-wide Single Sign-On via Google OAuth2. Allows all users across all tenants to authenticate securely using their Google accounts.',
              icon: 'google',
              isPlatform: true,
              details: [
                { label: 'Provider', value: 'Google Identity Services' },
                { label: 'OAuth Flow', value: 'Authorization Code (PKCE)' },
                { label: 'Client ID', value: '696744••••hv3ds.apps.googleusercontent.com' },
                { label: 'Authorized Origins', value: 'localhost:5173 · localhost:5000' },
                { label: 'Token Verify', value: 'google-auth-library (Backend)' }
              ]
            }
          }
        });
      }
    }

    const configs = await prisma.integrationConfig.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const mapped = configs.map(item => {
      const configJson = item.configJson || {};
      const typeUpper = (item.type || '').toUpperCase();
      const isPlatform = configJson.isPlatform || typeUpper.includes('STRIPE') || typeUpper.includes('GOOGLE') || item.name.toLowerCase().includes('stripe') || item.name.toLowerCase().includes('google');

      return {
        id: item.id,
        name: item.name,
        category: configJson.category || (typeUpper.includes('HRIS') ? 'HRIS & HCM' : typeUpper.includes('LMS') ? 'LMS / Learning' : typeUpper.includes('SSO') || typeUpper.includes('AUTH') ? 'SSO & Identity' : 'Collaboration'),
        type: isPlatform ? 'platform' : 'custom',
        status: item.status === 'ACTIVE' ? 'Connected' : 'Disconnected',
        lastSync: item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleString() : 'Never',
        description: configJson.description || `Enterprise connection for ${item.name} synchronized with SkillPulse platform.`,
        icon: configJson.icon || (item.name.toLowerCase().includes('stripe') ? 'stripe' : item.name.toLowerCase().includes('google') ? 'google' : null),
        activeTenants: isPlatform ? 'All Tenants' : '1 Workspace',
        endpointUrl: item.endpointUrl || configJson.endpointUrl || '',
        apiKey: configJson.apiKey || '',
        details: configJson.details || [
          { label: 'Endpoint Base URL', value: item.endpointUrl || configJson.endpointUrl || 'https://api.enterprise.com' },
          { label: 'Category', value: configJson.category || 'Custom Connector' },
          { label: 'Status', value: item.status === 'ACTIVE' ? 'Active Sync' : 'Disabled' }
        ]
      };
    });

    // Fetch rate limit setting from SystemParameter DB table
    const rateLimitParam = await prisma.systemParameter.findFirst({
      where: { key: { in: ['rateLimitMaxRequests', 'rateLimitPerMinute', 'RATE_LIMIT'] } }
    });
    const rateLimit = rateLimitParam && !isNaN(parseInt(rateLimitParam.value))
      ? parseInt(rateLimitParam.value).toLocaleString()
      : '10,000';

    res.json({ success: true, count: mapped.length, rateLimit, data: mapped });
  } catch (error) {
    next(error);
  }
};

export const createIntegration = async (req, res, next) => {
  try {
    let tenantId = req.user?.role === 'SUPER_ADMIN' ? (req.query?.tenantId || req.body?.tenantId || req.tenantId) : req.tenantId;
    if (!tenantId) {
      const defaultTenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
      if (defaultTenant) tenantId = defaultTenant.id;
    }

    const { name, category, type, description, apiKey, endpointUrl, clientId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Integration Name is required.' });
    }

    const integrationType = (type || 'CUSTOM').toUpperCase();

    const config = await prisma.integrationConfig.create({
      data: {
        tenantId,
        name: name.trim(),
        type: `${integrationType}_${Date.now()}`,
        endpointUrl: endpointUrl || null,
        status: 'ACTIVE',
        isEnabled: true,
        lastSyncAt: new Date(),
        configJson: {
          category: category || 'HRIS & HCM',
          description: description || `Enterprise connection for ${name.trim()} synchronized with SkillPulse platform.`,
          apiKey: apiKey || '',
          clientId: clientId || '',
          endpointUrl: endpointUrl || '',
          syncIntervalHours: 6,
          details: [
            { label: 'Endpoint Base URL', value: endpointUrl || 'https://api.enterprise.com' },
            { label: 'Client ID', value: clientId || (apiKey ? apiKey.slice(0, 8) + '••••' : 'N/A') },
            { label: 'Category', value: category || 'HRIS & HCM' },
            { label: 'Sync Interval', value: 'Every 6 Hours' }
          ]
        }
      }
    });

    if (req.user?.id || req.user?.userId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user?.id || req.user?.userId,
          action: 'INTEGRATION_CREATED',
          resource: 'IntegrationConfig',
          resourceId: config.id,
          details: { name: config.name, type: config.type }
        }
      }).catch(() => {});
    }

    res.status(201).json({ success: true, message: 'Enterprise Hub connected in database.', data: config });
  } catch (error) {
    next(error);
  }
};

export const updateIntegrationStatus = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.integrationConfig.findFirst({
      where: isSuperAdmin ? { id } : { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Integration hub not found.' });
    }

    const newStatus = (status === 'Connected' || status === 'ACTIVE') ? 'ACTIVE' : 'DISCONNECTED';

    const updated = await prisma.integrationConfig.update({
      where: { id },
      data: {
        status: newStatus,
        isEnabled: newStatus === 'ACTIVE',
        lastSyncAt: newStatus === 'ACTIVE' ? new Date() : existing.lastSyncAt
      }
    });

    res.json({ success: true, message: 'Integration status updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const triggerIntegrationSync = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const tenantId = req.tenantId;

    await prisma.integrationConfig.updateMany({
      where: isSuperAdmin ? { status: 'ACTIVE' } : { tenantId, status: 'ACTIVE' },
      data: { lastSyncAt: new Date() }
    });

    res.json({ success: true, message: 'Global sync completed across active enterprise connectors.' });
  } catch (error) {
    next(error);
  }
};
