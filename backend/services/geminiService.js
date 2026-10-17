/**
 * Generates personalized AI coaching feedback for a candidate resume
 * Uses Gemini API if GEMINI_API_KEY is configured, otherwise provides intelligent rule-based coaching.
 */

async function generateFeedback({ matchResults, resumeText, jdText, jobRole = 'Software Engineer' }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `
You are an expert technical recruiter and talent coach evaluating a candidate for a ${jobRole} position.

Job Description:
${jdText.slice(0, 1500)}

Candidate Resume Summary:
${resumeText.slice(0, 1500)}

Keyword Match Metrics:
- Base Math Score: ${matchResults.final_match_pct}%
- Matched Skills: ${matchResults.matched_skills.join(', ') || 'None specifically tagged'}
- Missing Skills: ${matchResults.missing_skills.join(', ') || 'None specifically missing'}

Evaluate the candidate and return STRICTLY a JSON object with:
1. "summary": A 2-3 sentence assessment of their candidacy.
2. "improvement_tips": An array of 3 actionable, specific bullet points of advice to improve their resume for this role.
3. "genuine_score": An integer between 0 and 100 representing their true holistic fit.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          return {
            summary: parsed.summary || 'Strong candidate profile with relevant background.',
            improvement_tips: Array.isArray(parsed.improvement_tips) ? parsed.improvement_tips : [],
            genuine_score: typeof parsed.genuine_score === 'number' ? parsed.genuine_score : Math.round(matchResults.final_match_pct)
          };
        }
      }
    } catch (err) {
      console.warn('[GeminiService] API call failed, using heuristic coaching:', err.message);
    }
  }

  // Resilient heuristic coaching engine (Default / Offline)
  return generateHeuristicFeedback(matchResults, jobRole);
}

function generateHeuristicFeedback(matchResults, jobRole) {
  const score = matchResults.final_match_pct;
  const matched = matchResults.matched_skills || [];
  const missing = matchResults.missing_skills || [];

  let summary = '';
  const tips = [];

  if (score >= 80) {
    summary = `Exceptional alignment for the ${jobRole} role. The candidate demonstrates strong proficiency in core required technologies (${matched.slice(0, 4).join(', ') || 'primary stack'}) with comprehensive practical exposure.`;
  } else if (score >= 60) {
    summary = `Solid foundation for the ${jobRole} position with strong competencies in ${matched.slice(0, 3).join(', ') || 'essential areas'}. With targeted additions in the remaining requirements, this candidate will be highly competitive.`;
  } else {
    summary = `Emerging candidate profile with foundational qualifications. While several transferable skills are present, substantial core requirements for ${jobRole} need further demonstration through hands-on projects or experience.`;
  }

  if (missing.length > 0) {
    tips.push(`Highlight practical project work or certifications involving ${missing.slice(0, 3).join(' and ')}.`);
  } else {
    tips.push('Quantify project impact with specific business metrics, latency improvements, or scale figures.');
  }

  if (matched.length > 0) {
    tips.push(`Elaborate on real-world architecture decisions made using ${matched[0]} and how you solved edge cases.`);
  } else {
    tips.push('Tailor the technical skills section to explicitly mirror the key technologies emphasized in the job description.');
  }

  tips.push('Include direct links to live deployments, GitHub repositories, or technical write-ups in the resume header.');

  const genuineScore = Math.min(98, Math.max(25, Math.round(score + (matched.length > 3 ? 5 : -3))));

  return {
    summary,
    improvement_tips: tips,
    genuine_score: genuineScore
  };
}

module.exports = {
  generateFeedback,
};
