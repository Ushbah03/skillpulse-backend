import prisma from '../config/db.js';
import { generateAIQuestionsForSkill } from '../services/aiQuestionService.js';

export const getMySkillProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userWithSkills = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        avatarUrl: true,
        role: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        skills: {
          include: {
            skill: {
              include: { category: true }
            }
          },
          orderBy: { proficiencyLevel: 'desc' }
        }
      }
    });

    res.json({ success: true, data: userWithSkills });
  } catch (error) {
    next(error);
  }
};

export const addOrUpdateSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const { skillId, skillName, categoryName, proficiencyLevel, yearsExperience } = req.body;

    if (proficiencyLevel === undefined) {
      return res.status(400).json({ success: false, message: 'proficiencyLevel is required.' });
    }

    let targetSkillId = skillId;

    // If skillId is not provided, resolve or create skill by name
    if (!targetSkillId && skillName) {
      const cleanName = skillName.trim();
      const cleanCategory = (categoryName || 'Technical').trim();

      // Find or create Category
      let category = await prisma.skillCategory.findFirst({
        where: { name: { equals: cleanCategory, mode: 'insensitive' } }
      });

      if (!category) {
        category = await prisma.skillCategory.create({
          data: { name: cleanCategory, tenantId: tenantId || null }
        });
      }

      // Find or create Skill
      let skill = await prisma.skill.findFirst({
        where: { name: { equals: cleanName, mode: 'insensitive' } }
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: cleanName,
            categoryId: category.id,
            tenantId: tenantId || null,
            isGlobal: false
          }
        });
      }

      targetSkillId = skill.id;
    }

    if (!targetSkillId) {
      return res.status(400).json({ success: false, message: 'Either skillId or skillName is required.' });
    }

    const updatedUserSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: { userId, skillId: targetSkillId }
      },
      update: {
        proficiencyLevel: parseFloat(proficiencyLevel),
        yearsExperience: yearsExperience !== undefined ? parseFloat(yearsExperience) : undefined,
        lastAssessedAt: new Date()
      },
      create: {
        userId,
        skillId: targetSkillId,
        proficiencyLevel: parseFloat(proficiencyLevel),
        yearsExperience: yearsExperience !== undefined ? parseFloat(yearsExperience) : 0,
        lastAssessedAt: new Date()
      },
      include: {
        skill: { include: { category: true } }
      }
    });

    res.json({ success: true, message: 'Skill profile updated.', data: updatedUserSkill });
  } catch (error) {
    next(error);
  }
};

export const deleteUserSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { userSkillId } = req.params;

    await prisma.userSkill.deleteMany({
      where: {
        id: userSkillId,
        userId: userId
      }
    });

    res.json({ success: true, message: 'Skill removed from profile.' });
  } catch (error) {
    next(error);
  }
};

export const getMySkillGaps = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const gaps = await prisma.skillGap.findMany({
      where: { userId },
      include: {
        skill: { include: { category: true } },
        assignedCourse: true
      },
      orderBy: { severity: 'asc' }
    });

    res.json({ success: true, count: gaps.length, data: gaps });
  } catch (error) {
    next(error);
  }
};

export const getMyLearningRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId || req.tenantId;

    // Fetch user's active skill gaps
    const userGaps = await prisma.skillGap.findMany({
      where: { userId },
      include: {
        skill: { include: { category: true } }
      }
    });

    const gapSkillIds = userGaps.map(g => g.skillId);

    // Find courses that teach these skills or general catalog
    let courses = await prisma.course.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null },
          { skillsTaught: { some: { skillId: { in: gapSkillIds } } } }
        ]
      },
      include: {
        skillsTaught: {
          include: { skill: true }
        },
        enrollments: {
          where: { userId }
        }
      }
    });

    // If catalog has few courses, auto-generate courses tailored to user's exact SkillGaps!
    if (courses.length < userGaps.length || courses.length === 0) {
      for (const gap of userGaps) {
        const skillName = gap.skill?.name || 'Technical';
        const categoryName = gap.skill?.category?.name || 'General';
        const courseTitle = `${skillName} Mastery & Practical Application`;

        let existingCourse = await prisma.course.findFirst({
          where: { title: { equals: courseTitle, mode: 'insensitive' } }
        });

        if (!existingCourse) {
          // Curate embed video URL based on skill keyword
          let videoUrl = 'https://www.youtube-nocookie.com/embed/c9Wg6Cb_YlU'; // Default Figma/Design
          const lowerS = skillName.toLowerCase();
          if (lowerS.includes('canva')) {
            videoUrl = 'https://www.youtube-nocookie.com/embed/un50Bs4BvZ8';
          } else if (lowerS.includes('problem') || lowerS.includes('critical')) {
            videoUrl = 'https://www.youtube-nocookie.com/embed/v34nQJeic88';
          } else if (lowerS.includes('k8s') || lowerS.includes('kubernetes')) {
            videoUrl = 'https://www.youtube-nocookie.com/embed/X48VuDVv0do';
          } else if (lowerS.includes('react') || lowerS.includes('frontend')) {
            videoUrl = 'https://www.youtube-nocookie.com/embed/w7ejDZ8SWv8';
          }

          existingCourse = await prisma.course.create({
            data: {
              tenantId: tenantId || null,
              title: courseTitle,
              description: `Comprehensive training program designed to eliminate skill gaps in ${skillName}. Includes hands-on projects and video modules.`,
              provider: categoryName === 'Design' ? 'SkillPulse Academy' : 'Internal LMS',
              durationHours: 12.0,
              level: gap.severity === 'CRITICAL' ? 'Advanced' : 'Intermediate',
              rating: 4.9,
              externalUrl: videoUrl,
              skillsTaught: {
                create: [
                  { skillId: gap.skillId, targetProficiency: 4.5 }
                ]
              }
            }
          });

          // Link gap to assigned course
          await prisma.skillGap.update({
            where: { id: gap.id },
            data: { assignedCourseId: existingCourse.id }
          }).catch(() => {});
        }
      }

      // Re-fetch updated courses
      courses = await prisma.course.findMany({
        where: {
          OR: [
            { tenantId },
            { tenantId: null },
            { skillsTaught: { some: { skillId: { in: gapSkillIds } } } }
          ]
        },
        include: {
          skillsTaught: {
            include: { skill: true }
          },
          enrollments: {
            where: { userId }
          }
        }
      });
    }

    const formatted = courses.map(course => {
      const enrollment = course.enrollments[0] || null;
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        provider: course.provider,
        durationHours: course.durationHours,
        level: course.level,
        rating: course.rating,
        externalUrl: course.externalUrl || 'https://www.youtube-nocookie.com/embed/c9Wg6Cb_YlU',
        isCompliance: course.isCompliance,
        skillsTaught: course.skillsTaught.map(st => st.skill.name),
        enrollmentStatus: enrollment ? enrollment.status : 'NOT_STARTED',
        progressPct: enrollment ? enrollment.progressPct : 0
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const enrollCourse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId || req.tenantId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required.' });
    }

    const courseObj = await prisma.course.findUnique({
      where: { id: courseId }
    });

    const enrollment = await prisma.learningEnrollment.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        status: 'NOT_STARTED',
        courseTitle: courseObj?.title || undefined
      },
      create: {
        tenantId: tenantId || null,
        userId,
        courseId,
        courseTitle: courseObj?.title || null,
        status: 'NOT_STARTED',
        progressPct: 0.0
      },
      include: { course: true }
    });

    res.json({ success: true, message: 'Training request submitted to Team Leader for approval.', data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const updateCourseProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId, progressPct } = req.body;

    const pct = parseFloat(progressPct);
    const isCompleted = pct >= 100;

    const courseObj = await prisma.course.findUnique({
      where: { id: courseId }
    });

    const enrollment = await prisma.learningEnrollment.update({
      where: {
        userId_courseId: { userId, courseId }
      },
      data: {
        progressPct: pct,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        courseTitle: courseObj?.title || undefined,
        completedAt: isCompleted ? new Date() : undefined,
        certificateUrl: isCompleted ? `https://skillpulse.ai/certificates/CERT-${Date.now()}` : undefined,
        credentialId: isCompleted ? `SP-${Math.random().toString(36).substring(2, 9).toUpperCase()}` : undefined
      },
      include: {
        course: {
          include: {
            skillsTaught: true
          }
        }
      }
    });

    // If completed (progress === 100%), auto-resolve skill gaps & verify user skills!
    if (isCompleted && enrollment.course?.skillsTaught) {
      for (const st of enrollment.course.skillsTaught) {
        // Upgrade/verify user skill in DB
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: { userId, skillId: st.skillId }
          },
          update: {
            proficiencyLevel: Math.max(4.0, st.targetProficiency || 4.5),
            verified: true,
            lastAssessedAt: new Date()
          },
          create: {
            userId,
            skillId: st.skillId,
            proficiencyLevel: Math.max(4.0, st.targetProficiency || 4.5),
            verified: true,
            lastAssessedAt: new Date()
          }
        });

        // Clear skill gap in DB
        await prisma.skillGap.deleteMany({
          where: { userId, skillId: st.skillId }
        }).catch(() => {});
      }
    }

    res.json({ success: true, message: isCompleted ? 'Course completed! Skill gap resolved & verified in DB.' : 'Progress updated.', data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const getAIQuestionsForAssessment = async (req, res, next) => {
  try {
    const { skillTitle, category, difficulty } = req.body;

    if (!skillTitle) {
      return res.status(400).json({ success: false, message: 'skillTitle is required.' });
    }

    const aiQuestions = await generateAIQuestionsForSkill(skillTitle, category, difficulty);

    res.json({
      success: true,
      data: aiQuestions || null
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAssessments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        skills: {
          include: {
            skill: { include: { category: true } }
          }
        }
      }
    });

    const assessmentsTaken = await prisma.skillAssessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const userSkills = user?.skills || [];
    const available = [];

    // Map passed tests by clean skill title
    const passedSkillsMap = {};
    assessmentsTaken.forEach(a => {
      const cleanTitle = a.title.replace(/Skill Verification|Advanced Mastery|Assessment|Test|Quiz/gi, '').trim().toLowerCase();
      if (a.score >= 75) {
        if (!passedSkillsMap[cleanTitle] || a.score > passedSkillsMap[cleanTitle].score) {
          passedSkillsMap[cleanTitle] = a;
        }
      }
    });

    // Dynamically build next-level assessments tailored to employee skills!
    userSkills.forEach((us, idx) => {
      const rawSkillName = us.skill?.name || 'Skill';
      const cleanSkillName = rawSkillName.replace(/Skill Verification|Advanced Mastery|Assessment|Test|Quiz/gi, '').trim();
      const categoryName = us.skill?.category?.name || 'Technical';
      const lookupKey = cleanSkillName.toLowerCase();
      const passedAttempt = passedSkillsMap[lookupKey];

      let difficulty = 'INTERMEDIATE';
      let title = `${cleanSkillName} Skill Verification`;

      if (passedAttempt) {
        // If user already passed Intermediate/First attempt, promote to Advanced Level!
        if (passedAttempt.resultsJson?.difficulty === 'ADVANCED' || passedAttempt.score >= 90) {
          // Mastered at highest level! Don't repeat in Available Assessments.
          return;
        } else {
          // Promote to Advanced level test
          difficulty = 'ADVANCED';
          title = `${cleanSkillName} Advanced Mastery`;
        }
      }

      available.push({
        id: `asm-user-${us.skillId || idx}`,
        title: title,
        category: categoryName,
        type: 'AI-BASED',
        duration: '5 Min',
        difficulty: difficulty,
        totalQuestions: 5,
        maxAttempts: 3
      });
    });

    // If user has few skills available, add general workplace/foundational assessments
    if (available.length < 3) {
      const defaultDomain = user?.department?.name || 'General';
      const foundational = [
        { id: 'asm-def-1', title: 'Problem Solving & Critical Thinking', category: 'Soft Skills', type: 'MCQ', duration: '5 Min', difficulty: 'INTERMEDIATE', totalQuestions: 5, maxAttempts: 3 },
        { id: 'asm-def-2', title: 'Workplace Communication', category: 'Soft Skills', type: 'AI-BASED', duration: '5 Min', difficulty: 'INTERMEDIATE', totalQuestions: 5, maxAttempts: 3 },
        { id: 'asm-def-3', title: `${defaultDomain} Industry Standards`, category: defaultDomain, type: 'PRACTICAL', duration: '5 Min', difficulty: 'ADVANCED', totalQuestions: 5, maxAttempts: 3 }
      ];

      foundational.forEach(f => {
        const cleanF = f.title.replace(/Skill Verification|Advanced Mastery|Assessment|Test|Quiz/gi, '').trim().toLowerCase();
        if (!passedSkillsMap[cleanF] && !available.some(a => a.title === f.title)) {
          available.push(f);
        }
      });
    }

    res.json({
      success: true,
      data: {
        taken: assessmentsTaken,
        available: available.slice(0, 6)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssessment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId || req.tenantId;
    const { title, category, score, totalQuestions, correctAnswers, resultsJson } = req.body;

    const numScore = parseFloat(score);

    const isPassed = numScore >= 75;

    // 1. Create Assessment Record with stored DB Certificate metadata
    const assessment = await prisma.skillAssessment.create({
      data: {
        userId,
        title,
        category: category || 'Technical',
        score: numScore,
        totalQuestions: parseInt(totalQuestions) || 5,
        correctAnswers: parseInt(correctAnswers) || 0,
        credentialId: isPassed ? `SP-CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null,
        certificateUrl: isPassed ? `/api/employee/assessments/certificate` : null,
        resultsJson: {
          ...(typeof resultsJson === 'object' && resultsJson !== null ? resultsJson : {}),
          certificate: isPassed ? {
            status: 'VERIFIED',
            title: title,
            issuedAt: new Date().toISOString()
          } : null
        }
      }
    });

    // 2. Clean Skill Name to prevent duplicate title string concatenation
    const cleanCategory = (category || 'Technical').trim();
    const cleanSkillName = (title || 'Technical')
      .replace(/Skill Verification|Advanced Mastery|Assessment|Test|Quiz/gi, '')
      .trim() || title;

    let categoryObj = await prisma.skillCategory.findFirst({
      where: { name: { equals: cleanCategory, mode: 'insensitive' } }
    });
    if (!categoryObj) {
      categoryObj = await prisma.skillCategory.create({
        data: { name: cleanCategory, tenantId: tenantId || null }
      });
    }

    let skillObj = await prisma.skill.findFirst({
      where: { name: { equals: cleanSkillName, mode: 'insensitive' } }
    });
    if (!skillObj) {
      skillObj = await prisma.skill.create({
        data: {
          name: cleanSkillName,
          categoryId: categoryObj.id,
          tenantId: tenantId || null
        }
      });
    }

    const calculatedProficiency = Math.min(5.0, Math.max(1.0, parseFloat(((numScore / 100) * 5.0).toFixed(1))));

    // 3. If Passed (Score >= 75%), Verify & Upgrade User Skill
    if (numScore >= 75) {
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: { userId, skillId: skillObj.id }
        },
        update: {
          proficiencyLevel: calculatedProficiency,
          verified: true,
          lastAssessedAt: new Date()
        },
        create: {
          userId,
          skillId: skillObj.id,
          proficiencyLevel: calculatedProficiency,
          verified: true,
          lastAssessedAt: new Date()
        }
      });

      // Clear any existing gap for this skill since employee passed!
      await prisma.skillGap.deleteMany({
        where: { userId, skillId: skillObj.id }
      }).catch(() => {});
    } else {
      // 4. If Failed (Score < 75%), Auto-Create or Update Skill Gap in DB!
      if (tenantId) {
        const gapSeverity = numScore < 50 ? 'CRITICAL' : 'HIGH';
        await prisma.skillGap.upsert({
          where: {
            userId_skillId: { userId, skillId: skillObj.id }
          },
          update: {
            currentLevel: calculatedProficiency,
            requiredLevel: 4.5,
            severity: gapSeverity
          },
          create: {
            tenantId,
            userId,
            skillId: skillObj.id,
            currentLevel: calculatedProficiency,
            requiredLevel: 4.5,
            severity: gapSeverity
          }
        });
      }
    }

    res.json({
      success: true,
      message: numScore >= 75 ? 'Congratulations! Assessment passed and skill verified.' : 'Assessment completed. Skill gap recorded for targeted learning.',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

export const getCareerPaths = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        skills: {
          include: { skill: { include: { category: true } } }
        },
        skillGaps: {
          include: { skill: true, assignedCourse: true }
        },
        assessments: {
          orderBy: { createdAt: 'asc' }
        },
        enrollments: {
          include: { course: true }
        }
      }
    });

    const userSkills = user?.skills || [];
    const gaps = user?.skillGaps || [];
    const assessments = user?.assessments || [];

    // Infer user domain from actual UserSkill names in DB
    const skillNames = userSkills.map(s => s.skill?.name || '').join(' ').toLowerCase();
    const gapNames = gaps.map(g => g.skill?.name || '').join(' ').toLowerCase();
    const allSkillText = `${skillNames} ${gapNames}`;

    let inferredDomain = 'Engineering';
    let inferredCurrentTitle = user?.jobTitle;

    if (!inferredCurrentTitle || inferredCurrentTitle === 'N/A' || inferredCurrentTitle === 'EMPLOYEE') {
      if (allSkillText.includes('figma') || allSkillText.includes('canva') || allSkillText.includes('design') || allSkillText.includes('ux') || allSkillText.includes('ui')) {
        inferredDomain = 'Product Design & UI/UX';
        inferredCurrentTitle = 'Product Designer';
      } else if (allSkillText.includes('react') || allSkillText.includes('frontend') || allSkillText.includes('angular') || allSkillText.includes('next')) {
        inferredDomain = 'Frontend Engineering';
        inferredCurrentTitle = 'Frontend Engineer';
      } else if (allSkillText.includes('docker') || allSkillText.includes('kubernetes') || allSkillText.includes('devops') || allSkillText.includes('cloud') || allSkillText.includes('aws')) {
        inferredDomain = 'Cloud & DevOps Engineering';
        inferredCurrentTitle = 'DevOps Engineer';
      } else {
        inferredCurrentTitle = 'Software Engineer';
      }
    }

    const userDept = user?.department?.name || inferredDomain;

    // Calculate real readiness percentage based on UserSkills vs Gaps
    const totalGapsCount = gaps.length;
    let targetReadiness = 75;
    if (userSkills.length > 0) {
      const sumProficiency = userSkills.reduce((acc, s) => acc + (s.proficiencyLevel || 1.0), 0);
      const avgProficiency = sumProficiency / userSkills.length; // Out of 5.0
      targetReadiness = Math.min(100, Math.max(30, Math.round((avgProficiency / 5.0) * 100)));
    } else if (totalGapsCount > 0) {
      targetReadiness = Math.max(40, Math.round(100 - (totalGapsCount * 15)));
    }

    // Dynamic Career Roadmap steps based on employee's actual domain
    const isDesign = inferredDomain.includes('Design') || allSkillText.includes('figma') || allSkillText.includes('canva');
    const isFrontend = inferredDomain.includes('Frontend') || allSkillText.includes('react');

    const roadmap = [
      { step: 1, label: inferredCurrentTitle, sub: 'CURRENT ROLE', status: 'active' },
      { step: 2, label: isDesign ? 'Senior UI/UX Specialist' : isFrontend ? 'Senior Frontend Engineer' : `Senior ${inferredCurrentTitle}`, sub: 'NEXT STEP', status: 'active', flag: true },
      { step: 3, label: isDesign ? 'Lead Design Systems Architect' : isFrontend ? 'Lead Frontend Architect' : `Lead ${userDept} Specialist`, sub: 'TARGET PATH', status: 'pending', star: true },
      { step: 4, label: isDesign ? 'Head of Product Design' : isFrontend ? 'Director of Frontend' : `Principal ${userDept} Director`, sub: 'ADVANCED', status: 'locked' }
    ];

    // Dynamic Recommended Target Paths
    const primaryTargetTitle = isDesign ? 'Lead Design Systems Architect' : isFrontend ? 'Lead Frontend Architect' : `Lead ${userDept} Specialist`;
    const secondaryTargetTitle = isDesign ? 'Design Operations Manager' : isFrontend ? 'Engineering Team Lead' : `${userDept} Technical Manager`;

    const recommendedPaths = [
      {
        id: 'path-1',
        title: primaryTargetTitle,
        dept: `${userDept} Group`,
        gapsCount: totalGapsCount,
        gapsText: `${totalGapsCount} Active Skill ${totalGapsCount === 1 ? 'Gap' : 'Gaps'}`,
        timeToReady: totalGapsCount === 0 ? 'Ready Now' : `~ ${Math.max(1, Math.round(totalGapsCount * 1.5))} Months`,
        readiness: `${targetReadiness}%`,
        subText: targetReadiness >= 75 ? 'HIGH READINESS MATCH' : 'MODERATE READINESS MATCH',
        isPrimary: true
      },
      {
        id: 'path-2',
        title: secondaryTargetTitle,
        dept: 'Engineering & Operations',
        gapsCount: totalGapsCount + 2,
        gapsText: `${totalGapsCount + 2} Active Skill Gaps`,
        timeToReady: `~ ${Math.max(3, Math.round((totalGapsCount + 2) * 1.5))} Months`,
        readiness: `${Math.max(35, targetReadiness - 15)}%`,
        subText: 'REQUIRES LEADERSHIP TRACK',
        isPrimary: false
      }
    ];

    // Build Monthly Readiness Chart from actual DB SkillAssessment scores!
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'NOW', 'Jun', 'Jul', 'Aug'];
    const monthlyProgress = monthsList.map((month, idx) => {
      if (month === 'NOW') {
        return { month, heightPct: `${targetReadiness}%`, active: true, forecast: false };
      } else if (idx < 4) {
        // Find if user took an assessment around that historical index
        const matchAsm = assessments[idx];
        const scoreVal = matchAsm ? Math.round(matchAsm.score) : Math.max(35, targetReadiness - ((4 - idx) * 8));
        return { month, heightPct: `${scoreVal}%`, active: false, forecast: false };
      } else {
        const forecastVal = Math.min(100, targetReadiness + ((idx - 4) * 6));
        return { month, heightPct: `${forecastVal}%`, active: false, forecast: true };
      }
    });

    // Real Acceleration Plan from DB (Find top gap and matching course)
    let recommendedCourseTitle = 'Enterprise Skill Mastery Course';
    let targetCertTitle = 'SkillPulse Professional Certification';

    if (gaps.length > 0) {
      const topGap = gaps[0];
      if (topGap.assignedCourse) {
        recommendedCourseTitle = topGap.assignedCourse.title;
      } else {
        const matchCourseSkill = await prisma.courseSkill.findFirst({
          where: { skillId: topGap.skillId },
          include: { course: true }
        });
        if (matchCourseSkill?.course) {
          recommendedCourseTitle = matchCourseSkill.course.title;
        } else {
          recommendedCourseTitle = `${topGap.skill?.name || 'Advanced Technical'} Mastery & Application`;
        }
      }
      targetCertTitle = `Certified ${topGap.skill?.name || 'Technical'} Specialist`;
    } else {
      const anyCourse = await prisma.course.findFirst({ orderBy: { rating: 'desc' } });
      if (anyCourse) {
        recommendedCourseTitle = anyCourse.title;
      }
    }

    res.json({
      success: true,
      data: {
        userProfile: {
          jobTitle: inferredCurrentTitle,
          department: userDept,
          avatarUrl: user?.avatarUrl,
          fullName: `${user?.firstName || 'Employee'} ${user?.lastName || ''}`
        },
        primaryTargetRole: primaryTargetTitle,
        targetReadiness,
        gaps,
        roadmap,
        recommendedPaths,
        monthlyProgress,
        accelerationPlan: {
          recommendedCourse: recommendedCourseTitle,
          targetCertification: targetCertTitle,
          estimatedIncrease: `+${totalGapsCount > 0 ? 15 : 5}% in 30 Days`
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

