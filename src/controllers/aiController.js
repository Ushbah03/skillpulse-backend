import prisma from '../config/db.js';
import { analyzeSkillGapWithGemini } from '../services/geminiService.js';

export const inferSkillGaps = async (req, res, next) => {
  try {
    const { userId, targetRole } = req.body;
    const targetUserId = userId || req.user?.id;

    const user = targetUserId ? await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        skills: { include: { skill: true } }
      }
    }) : null;

    const currentSkills = (user?.skills || []).map(s => ({
      name: s.skill.name,
      level: s.proficiencyLevel
    }));

    const target = targetRole || user?.jobTitle || 'Senior DevOps Engineer';

    const aiAnalysis = await analyzeSkillGapWithGemini({
      employeeName: user ? `${user.firstName} ${user.lastName}` : 'Employee Profile',
      jobTitle: user?.jobTitle || 'Engineer',
      currentSkills,
      targetRole: target,
      requiredSkills: ['Kubernetes Cluster Security', 'Python Microservices', 'React.js Architecture']
    });

    res.json({
      success: true,
      roleAnalyzed: target,
      readinessScore: aiAnalysis.readinessScore,
      matchPercentage: aiAnalysis.matchPercentage,
      overallRisk: aiAnalysis.overallRisk,
      aiSummary: aiAnalysis.aiSummary,
      inferredGaps: aiAnalysis.gapsDetected
    });
  } catch (error) {
    next(error);
  }
};

export const matchSquadForProject = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { requiredSkills = [], teamSize = 6 } = req.body;

    const availableEmployees = await prisma.user.findMany({
      where: { tenantId, role: { in: ['EMPLOYEE', 'TEAM_LEADER'] } },
      include: {
        skills: { include: { skill: true } }
      }
    });

    // Calculate active project count per employee across existing ProjectRecommendations
    const recommendations = await prisma.projectRecommendation.findMany({
      where: {
        project: { tenantId, status: { in: ['PLANNING', 'ACTIVE'] } }
      },
      select: { recommendedSquad: true }
    });

    const activeProjectCountMap = {};
    recommendations.forEach(rec => {
      const squad = Array.isArray(rec.recommendedSquad) ? rec.recommendedSquad : [];
      squad.forEach(member => {
        const uid = member.userId || member.id;
        if (uid) {
          activeProjectCountMap[uid] = (activeProjectCountMap[uid] || 0) + 1;
        }
      });
    });

    const skillDeficiencySet = new Set(requiredSkills.map(s => typeof s === 'string' ? s.trim() : (s?.name || '').trim()));

    const scoredCandidates = availableEmployees.map(emp => {
      let matchedWeight = 0;
      let totalWeight = 0;
      const matchedSkills = [];
      const missingSkills = [];

      requiredSkills.forEach(reqSkill => {
        const reqSkillName = typeof reqSkill === 'string' ? reqSkill.trim() : (reqSkill?.name || '').trim();
        const minLevel = typeof reqSkill === 'object' && reqSkill?.minLevel ? reqSkill.minLevel : 3.0;
        const weight = typeof reqSkill === 'object' && reqSkill?.weight ? reqSkill.weight : 1.0;
        
        totalWeight += weight;
        if (reqSkillName) {
          const userSkill = emp.skills.find(s => 
            s.skill?.name?.toLowerCase().includes(reqSkillName.toLowerCase()) || 
            reqSkillName.toLowerCase().includes(s.skill?.name?.toLowerCase())
          );

          if (userSkill && userSkill.proficiencyLevel > 0) {
            const ratio = Math.min(1.0, userSkill.proficiencyLevel / minLevel);
            matchedWeight += ratio * weight;
            matchedSkills.push(`${userSkill.skill.name} (${userSkill.proficiencyLevel}/5)`);
            skillDeficiencySet.delete(reqSkillName);
          } else {
            missingSkills.push(reqSkillName);
          }
        }
      });

      // 100% REAL MATCH SCORE - STRICTLY DERIVED FROM REAL DB SKILLS
      const fitScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
      const activeProjectsCount = activeProjectCountMap[emp.id] || 0;
      const capacityPct = activeProjectsCount >= 2 ? 100 : activeProjectsCount === 1 ? 50 : 0;
      const isFullCapacity = activeProjectsCount >= 2;

      return {
        userId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        jobTitle: emp.jobTitle || emp.role,
        avatarUrl: emp.avatarUrl,
        matchScore: fitScore, // 100% REAL MATCH SCORE (0% to 100%)
        matchedSkills,
        missingSkills,
        skillsRecorded: emp.skills.map(s => `${s.skill.name} (${s.proficiencyLevel})`),
        activeProjectsCount,
        capacityPct,
        isFullCapacity,
        capacityLabel: isFullCapacity ? '100% Capacity (Full)' : activeProjectsCount === 1 ? '50% Capacity' : 'Available (0%)'
      };
    });

    // Sort candidates by REAL matchScore descending
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    const selectedSquad = scoredCandidates.slice(0, teamSize);

    // Calculate REAL overall squad score from selected members
    const overallSquadSynergy = selectedSquad.length > 0
      ? Math.round(selectedSquad.reduce((acc, c) => acc + c.matchScore, 0) / selectedSquad.length)
      : 0;

    // Check if any required skills are missing across ALL team members in database
    const missingInTeam = Array.from(skillDeficiencySet);
    const hasDeficiency = missingInTeam.length > 0;

    res.json({
      success: true,
      overallSquadScore: overallSquadSynergy,
      skillCoveragePct: requiredSkills.length > 0 ? Math.round(((requiredSkills.length - missingInTeam.length) / requiredSkills.length) * 100) : 100,
      recommendedSquad: selectedSquad,
      hasDeficiency,
      missingInTeam,
      aiHiringRecommendation: hasDeficiency 
        ? `Skill Gap Alert: None of your team members possess verified proficiency in [${missingInTeam.join(', ')}]. AI recommends assigning targeted LMS training courses or initiating a new hire requisition.`
        : 'Squad capability covers 100% of target project requirements.'
    });
  } catch (error) {
    next(error);
  }
};
