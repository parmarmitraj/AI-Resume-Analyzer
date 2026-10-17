const fs = require('fs');
const path = require('path');

// Structural stop words to prevent false-positive skill matching
const STOPWORDS = new Set([
  'using', 'used', 'use', 'developed', 'built', 'implemented', 'created',
  'deployed', 'services', 'interfaces', 'with', 'and', 'a', 'an', 'the',
  'in', 'on', 'for', 'to', 'of', 'by', 'at', 'or', 'is', 'are', 'was',
  'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'this', 'that', 'these', 'those', 'it', 'its', 'my', 'our', 'your',
  'their', 'his', 'her', 'i', 'me', 'we', 'they', 'he', 'she',
  'also', 'etc', 'experience', 'working', 'knowledge', 'understanding',
  'ability', 'work', 'project', 'team', 'year', 'years', 'including',
  'strong', 'good', 'basic', 'building', 'based', 'design', 'develop',
  'responsible', 'application', 'applications', 'system', 'systems',
  'development', 'management', 'tool', 'tools', 'technology', 'technologies',
  'testing', 'test', 'data', 'process', 'processes', 'solution', 'solutions'
]);

// Common technical skills & modern aliases
const COMMON_ALIASES = [
  'node.js', 'nodejs', 'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'express', 'express.js',
  'next.js', 'nextjs', 'angular', 'angular.js', 'scikit-learn', 'sklearn', 'kubernetes', 'k8s',
  'tensorflow', 'tf', 'javascript', 'js', 'typescript', 'ts', 'aws', 'gcp', 'azure',
  'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'llm', 'genai',
  'docker', 'git', 'github', 'mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'supabase',
  'html', 'css', 'tailwind css', 'tailwindcss', 'bootstrap', 'streamlit', 'python', 'java',
  'c++', 'c#', 'php', 'ruby', 'swift', 'golang', 'rust', 'ci/cd', 'jenkins', 'graphql',
  'apollo', 'memcached', 'elasticsearch', 'kafka', 'rabbitmq', 'react native', 'flutter',
  'fastapi', 'django', 'flask', 'pandas', 'numpy', 'pytorch', 'keras', 'xgboost', 'langchain',
  'langgraph', 'rag', 'openai', 'claude', 'gemini', 'mern', 'mean', 'lamp', 'frontend',
  'backend', 'full stack', 'fullstack', 'devops', 'cloud', 'api', 'rest api', 'microservices',
  'linux', 'bash', 'sql', 'nosql', 'agile', 'scrum', 'jira', 'figma', 'postman'
];

// Skill Knowledge Base (Aliases & Inferences)
const SKILL_KNOWLEDGE_BASE = {
  // Alias Resolution
  'nodejs': ['node.js'],
  'node': ['node.js'],
  'react.js': ['react'],
  'reactjs': ['react'],
  'vue.js': ['vue'],
  'vuejs': ['vue'],
  'express.js': ['express'],
  'expressjs': ['express'],
  'next.js': ['next'],
  'nextjs': ['next'],
  'angular.js': ['angular'],
  'angularjs': ['angular'],
  'scikit-learn': ['sklearn'],
  'sklearn': ['scikit-learn'],
  'postgres': ['postgresql'],
  'mongo': ['mongodb'],
  'k8s': ['kubernetes'],
  'tf': ['tensorflow'],
  'js': ['javascript'],
  'ts': ['typescript'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud platform'],
  'tailwind': ['tailwind css'],
  'tailwindcss': ['tailwind css'],

  // Skill Inference
  'mern': ['react', 'node.js', 'express', 'mongodb', 'frontend development', 'backend development', 'api', 'javascript'],
  'mean': ['angular', 'node.js', 'express', 'mongodb', 'frontend development', 'backend development', 'api', 'javascript'],
  'react': ['frontend development', 'javascript'],
  'angular': ['frontend development', 'javascript', 'typescript'],
  'vue': ['frontend development', 'javascript'],
  'next': ['frontend development', 'react', 'javascript'],
  'node.js': ['backend development', 'api', 'javascript'],
  'express': ['backend development', 'api', 'node.js'],
  'django': ['backend development', 'python'],
  'flask': ['backend development', 'python'],
  'fastapi': ['backend development', 'python', 'api'],
  'spring': ['backend development', 'java'],
  'python': ['python'],
  'java': ['java'],
  'javascript': ['javascript'],
  'typescript': ['javascript', 'typescript'],
  'machine learning': ['ai', 'machine learning'],
  'deep learning': ['ai', 'machine learning', 'deep learning'],
  'scikit-learn': ['machine learning', 'python', 'ai'],
  'tensorflow': ['machine learning', 'deep learning', 'ai', 'python'],
  'pytorch': ['machine learning', 'deep learning', 'ai', 'python'],
  'keras': ['machine learning', 'deep learning', 'ai', 'python'],
  'pandas': ['python', 'data analysis'],
  'numpy': ['python', 'data analysis'],
  'xgboost': ['machine learning', 'ai'],
  'langchain': ['ai', 'llm'],
  'openai': ['ai', 'llm'],
  'docker': ['devops', 'containerization'],
  'kubernetes': ['devops', 'containerization'],
  'git': ['version control'],
  'github': ['version control', 'git'],
  'mongodb': ['database', 'nosql'],
  'postgresql': ['database', 'sql'],
  'mysql': ['database', 'sql'],
  'firebase': ['database', 'cloud'],
  'supabase': ['database', 'cloud'],
  'redis': ['database', 'caching'],
  'html': ['frontend development'],
  'css': ['frontend development'],
};

// In-memory normalized skill database
const KNOWN_SKILLS_DB = new Set();
const NORMALIZED_SKILLS = new Map();

function normalizeSkillKey(skill) {
  return skill
    .toLowerCase()
    .replace(/[^\w+#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Load skills.csv on startup
function initSkillDatabase() {
  const possiblePaths = [
    path.join(__dirname, '../../skills.csv'),
    path.join(__dirname, '../skills.csv'),
    path.join(process.cwd(), 'skills.csv'),
    path.join(process.cwd(), '../skills.csv')
  ];

  let loaded = false;
  for (const csvPath of possiblePaths) {
    if (fs.existsSync(csvPath)) {
      try {
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const raw = line.split(',')[0].replace(/"/g, '').trim().toLowerCase();
          if (raw.length > 1 && !STOPWORDS.has(raw)) {
            KNOWN_SKILLS_DB.add(raw);
          }
        }
        loaded = true;
        break;
      } catch (err) {
        console.warn(`[SkillExtractor] Could not parse ${csvPath}:`, err.message);
      }
    }
  }

  // Always seed with critical aliases
  for (const skill of COMMON_ALIASES) {
    KNOWN_SKILLS_DB.add(skill.toLowerCase());
  }

  // Pre-compute normalized map
  for (const skill of KNOWN_SKILLS_DB) {
    const norm = normalizeSkillKey(skill);
    if (norm.length > 1 && !STOPWORDS.has(norm)) {
      NORMALIZED_SKILLS.set(norm, skill);
    }
  }

  console.log(`[SkillExtractor] Loaded ${NORMALIZED_SKILLS.size} normalized skills.`);
}

initSkillDatabase();

/**
 * Extracts technical and domain skills from raw or cleaned text
 * @param {string} text - Raw resume or job description text
 * @returns {string[]} - Array of unique identified skills in lowercase
 */
function extractSkills(text) {
  if (!text || typeof text !== 'string') return [];

  const foundSkills = new Set();
  const textLower = text.toLowerCase();

  // Normalize text while keeping alphanumeric, +, #
  const normalizedText = ' ' + textLower
    .replace(/[^\w+#]/g, ' ')
    .replace(/\s+/g, ' ') + ' ';

  // Match against normalized dictionary
  for (const [normSkill, originalSkill] of NORMALIZED_SKILLS.entries()) {
    if (normalizedText.includes(` ${normSkill} `)) {
      foundSkills.add(originalSkill);
    }
  }

  return Array.from(foundSkills);
}

/**
 * Normalizes extracted skills and expands with domain inferences (e.g., MERN -> React, Node, Mongo)
 * @param {string[]} extractedSkills - List of raw extracted skills
 * @returns {Set<string>} - Set of normalized and inferred skills
 */
function normalizeAndInfer(extractedSkills) {
  const result = new Set();

  for (const skill of extractedSkills) {
    const s = skill.toLowerCase().trim();
    if (!s) continue;

    result.add(s);

    if (SKILL_KNOWLEDGE_BASE[s]) {
      for (const inferred of SKILL_KNOWLEDGE_BASE[s]) {
        result.add(inferred.toLowerCase().trim());
      }
    }
  }

  return result;
}

module.exports = {
  extractSkills,
  normalizeAndInfer,
  SKILL_KNOWLEDGE_BASE
};
