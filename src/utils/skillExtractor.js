/**
 * Smart Skill Extraction Engine for SkillPulse AI
 * Extracts technical, domain, soft skills, tools, frameworks, and leadership skills from CVs, Resumes, or Project text.
 */

const SKILL_DATABASE = [
  // Frontend
  { name: 'React.js', category: 'Technical', aliases: ['react', 'reactjs', 'react.js'], defaultProf: 4.5 },
  { name: 'Next.js', category: 'Technical', aliases: ['nextjs', 'next.js', 'next'], defaultProf: 4.2 },
  { name: 'TypeScript', category: 'Technical', aliases: ['typescript', 'ts'], defaultProf: 4.3 },
  { name: 'JavaScript', category: 'Technical', aliases: ['javascript', 'js', 'es6'], defaultProf: 4.5 },
  { name: 'Tailwind CSS', category: 'Technical', aliases: ['tailwind', 'tailwind css', 'tailwindcss'], defaultProf: 4.4 },
  { name: 'HTML5/CSS3', category: 'Technical', aliases: ['html', 'css', 'html5', 'css3'], defaultProf: 4.5 },
  { name: 'Redux Toolkit', category: 'Technical', aliases: ['redux', 'redux toolkit', 'rtk'], defaultProf: 4.0 },
  { name: 'Vue.js', category: 'Technical', aliases: ['vue', 'vuejs', 'vue.js'], defaultProf: 3.8 },
  { name: 'Angular', category: 'Technical', aliases: ['angular', 'angularjs'], defaultProf: 3.8 },

  // Backend
  { name: 'Node.js', category: 'Technical', aliases: ['node', 'nodejs', 'node.js'], defaultProf: 4.5 },
  { name: 'Express.js', category: 'Technical', aliases: ['express', 'expressjs', 'express.js'], defaultProf: 4.3 },
  { name: 'Python', category: 'Technical', aliases: ['python', 'python3'], defaultProf: 4.2 },
  { name: 'RESTful API Design', category: 'Technical', aliases: ['rest api', 'restful api', 'restful apis', 'restful api design', 'rest apis'], defaultProf: 4.5 },
  { name: 'GraphQL', category: 'Technical', aliases: ['graphql'], defaultProf: 4.0 },
  { name: 'Java', category: 'Technical', aliases: ['java'], defaultProf: 3.8 },
  { name: 'C++', category: 'Technical', aliases: ['c\\+\\+'], defaultProf: 3.8 },
  { name: 'C#', category: 'Technical', aliases: ['c#', 'c-sharp'], defaultProf: 3.8 },
  { name: 'PHP', category: 'Technical', aliases: ['php'], defaultProf: 3.5 },

  // Database
  { name: 'PostgreSQL', category: 'Technical', aliases: ['postgresql', 'postgres'], defaultProf: 4.4 },
  { name: 'Prisma ORM', category: 'Technical', aliases: ['prisma', 'prisma orm'], defaultProf: 4.3 },
  { name: 'MongoDB', category: 'Technical', aliases: ['mongodb', 'mongo'], defaultProf: 4.0 },
  { name: 'Redis', category: 'Technical', aliases: ['redis'], defaultProf: 4.0 },
  { name: 'Neon Serverless DB', category: 'Technical', aliases: ['neon', 'neon db', 'neon serverless'], defaultProf: 4.2 },
  { name: 'MySQL', category: 'Technical', aliases: ['mysql'], defaultProf: 4.0 },

  // AI & ML
  { name: 'OpenAI GPT-4o API', category: 'Domain', aliases: ['openai', 'gpt-4', 'gpt-4o', 'chatgpt api'], defaultProf: 4.5 },
  { name: 'Groq LPU Inference', category: 'Domain', aliases: ['groq', 'groq lpu', 'groq api'], defaultProf: 4.4 },
  { name: 'Google Gemini API', category: 'Domain', aliases: ['gemini', 'gemini api', 'google gemini'], defaultProf: 4.2 },
  { name: 'Prompt Engineering', category: 'Domain', aliases: ['prompt engineering', 'prompts'], defaultProf: 4.3 },
  { name: 'Machine Learning', category: 'Domain', aliases: ['machine learning', 'ml', 'deep learning'], defaultProf: 4.0 },

  // Cloud & DevOps
  { name: 'Docker', category: 'Technical', aliases: ['docker', 'containerization'], defaultProf: 4.2 },
  { name: 'Kubernetes', category: 'Technical', aliases: ['kubernetes', 'k8s'], defaultProf: 4.0 },
  { name: 'AWS Lambda', category: 'Technical', aliases: ['aws lambda', 'lambda'], defaultProf: 4.2 },
  { name: 'Amazon Web Services (AWS)', category: 'Technical', aliases: ['aws', 'amazon web services', 'aws cloud'], defaultProf: 4.3 },
  { name: 'CI/CD Pipelines', category: 'Technical', aliases: ['ci/cd', 'ci/cd pipelines', 'github actions', 'jenkins'], defaultProf: 4.2 },
  { name: 'Vercel Deployment', category: 'Technical', aliases: ['vercel', 'vercel deployment'], defaultProf: 4.4 },

  // Soft Skills & Leadership
  { name: 'Technical Team Leadership', category: 'Leadership', aliases: ['team leadership', 'lead developer', 'tech lead', 'leading cross-functional', 'engineering leadership'], defaultProf: 4.5 },
  { name: 'Agile/Scrum Project Management', category: 'Leadership', aliases: ['agile', 'scrum', 'sprint planning', 'agile/scrum'], defaultProf: 4.4 },
  { name: 'Problem Solving & Critical Thinking', category: 'Soft Skills', aliases: ['problem solving', 'critical thinking', 'analytical thinking'], defaultProf: 4.5 },
  { name: 'Cross-Functional Communication', category: 'Soft Skills', aliases: ['communication', 'cross-functional communication', 'stakeholder management'], defaultProf: 4.3 },
  { name: 'Mentorship', category: 'Leadership', aliases: ['mentoring', 'mentorship', 'coaching'], defaultProf: 4.2 },
  { name: 'Code Review', category: 'Leadership', aliases: ['code review', 'code reviews'], defaultProf: 4.3 },

  // Product & Design
  { name: 'Figma UI/UX Prototyping', category: 'Design', aliases: ['figma', 'ui/ux', 'prototyping', 'wireframing'], defaultProf: 4.3 },
  { name: 'System Architecture', category: 'Domain', aliases: ['system architecture', 'microservices', 'restful api design', 'software architecture'], defaultProf: 4.5 },
  { name: 'Stripe Payment Integration', category: 'Domain', aliases: ['stripe', 'payment gateway', 'stripe payment'], defaultProf: 4.2 },
  { name: 'JWT & RBAC Security', category: 'Domain', aliases: ['jwt', 'rbac', 'authentication', 'authorization'], defaultProf: 4.4 }
];

export function extractSkillsSmart(text) {
  if (!text || typeof text !== 'string') return [];
  const normalizedText = text.toLowerCase();

  // Extract overall experience (e.g. "4+ years", "3 years")
  let extractedYears = 2;
  const yearsMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(professional\s*)?experience/i);
  if (yearsMatch) {
    extractedYears = parseInt(yearsMatch[1], 10);
  }

  const foundSkillsMap = new Map();

  for (const skillDef of SKILL_DATABASE) {
    for (const alias of skillDef.aliases) {
      // Escape special regex chars except word matching
      const regexPattern = new RegExp(`(?:^|[^a-zA-Z0-9])(${alias})(?:$|[^a-zA-Z0-9])`, 'i');
      if (regexPattern.test(normalizedText)) {
        if (!foundSkillsMap.has(skillDef.name)) {
          foundSkillsMap.set(skillDef.name, {
            skillName: skillDef.name,
            categoryName: skillDef.category,
            proficiencyLevel: skillDef.defaultProf,
            yearsExperience: Math.max(1, extractedYears - Math.floor(Math.random() * 2)),
            reasoning: `Extracted from CV content matching '${alias}' keyword.`
          });
        }
        break;
      }
    }
  }

  return Array.from(foundSkillsMap.values());
}
