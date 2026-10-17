const { extractSkills, normalizeAndInfer } = require('./skillExtractor');

/**
 * Tokenizes text for TF-IDF contextual similarity
 * Strips punctuation and returns clean lowercase tokens
 */
function tokenizeText(text) {
  if (!text) return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s+#]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
  return tokens;
}

/**
 * Computes TF-IDF vectors and Cosine Similarity between two text documents
 * @param {string} docA - Job Description text
 * @param {string} docB - Resume text
 * @returns {number} - Cosine similarity score between 0.0 and 1.0
 */
function calculateTfidfCosineSimilarity(docA, docB) {
  const tokensA = tokenizeText(docA);
  const tokensB = tokenizeText(docB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Build vocabulary
  const vocab = new Set([...tokensA, ...tokensB]);

  // Compute Term Frequencies
  const tfA = {};
  const tfB = {};
  for (const t of tokensA) tfA[t] = (tfA[t] || 0) + 1;
  for (const t of tokensB) tfB[t] = (tfB[t] || 0) + 1;

  // Compute Document Frequencies (N = 2)
  const idf = {};
  for (const word of vocab) {
    let df = 0;
    if (tfA[word]) df += 1;
    if (tfB[word]) df += 1;
    // Standard smoothed IDF: ln((1 + N) / (1 + df)) + 1
    idf[word] = Math.log((1 + 2) / (1 + df)) + 1;
  }

  // Calculate TF-IDF vectors, dot product, and magnitudes
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const word of vocab) {
    const valA = (tfA[word] ? (tfA[word] / tokensA.length) * idf[word] : 0);
    const valB = (tfB[word] ? (tfB[word] / tokensB.length) * idf[word] : 0);

    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (denominator === 0) return 0;

  const cosineSim = dotProduct / denominator;
  return Math.min(1.0, Math.max(0.0, cosineSim));
}

/**
 * Calculates full dual-pronged match metrics between resume text and job description
 * @param {string} resumeText - Raw text of candidate resume
 * @param {string} jdText - Job description text
 * @returns {object} - Match score metrics, matched skills, missing skills
 */
function calculateMatch(resumeText, jdText) {
  // Step 1: Extract and infer skills
  const rawResumeSkills = extractSkills(resumeText);
  const rawJdSkills = extractSkills(jdText);

  const resumeSkills = normalizeAndInfer(rawResumeSkills);
  const jdSkills = normalizeAndInfer(rawJdSkills);

  // Step 2: Set-based exact skill match
  let matchedSkills = [];
  let missingSkills = [];
  let skillScore = 0;

  if (jdSkills.size === 0) {
    // If JD has no detected specific keywords, check candidate skills volume
    matchedSkills = Array.from(resumeSkills);
    skillScore = Math.min(100, resumeSkills.size * 10);
  } else {
    for (const skill of jdSkills) {
      if (resumeSkills.has(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    skillScore = (matchedSkills.length / jdSkills.size) * 100;
  }

  // Step 3: TF-IDF contextual similarity
  const cosineSim = calculateTfidfCosineSimilarity(jdText, resumeText);
  const contextScore = cosineSim * 100;

  // Step 4: Weighted blend (50% skill score + 50% context score)
  const rawFinalScore = (skillScore * 0.50) + (contextScore * 0.50);

  // Non-linear curving (Square-root curve) to align with human grading intuition
  const finalScore = rawFinalScore > 0 ? Math.sqrt(rawFinalScore / 100.0) * 100.0 : 0.0;

  return {
    matched_skills: matchedSkills.sort(),
    missing_skills: missingSkills.sort(),
    all_resume_skills: Array.from(resumeSkills).sort(),
    skill_score_pct: parseFloat(skillScore.toFixed(2)),
    context_score_pct: parseFloat(contextScore.toFixed(2)),
    final_match_pct: parseFloat(Math.min(100, Math.max(0, finalScore)).toFixed(2))
  };
}

module.exports = {
  calculateMatch,
  calculateTfidfCosineSimilarity,
};
