const JobPosting = require('../models/JobPosting');
const Application = require('../models/Application');
const { isMongoConnected, memoryStore } = require('../config/db');
const { extractTextFromPDF } = require('../services/pdfService');
const { extractSkills } = require('../services/skillExtractor');
const { calculateMatch } = require('../services/matcherService');
const { generateFeedback } = require('../services/geminiService');

/**
 * Standalone Single Resume Analysis against a custom JD
 * (Maintains contract with existing /api/student/analyze)
 */
exports.analyzeSingleResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Resume PDF is required.' });
    }

    const { job_description, job_role } = req.body;
    if (!job_description || !job_description.trim()) {
      return res.status(400).json({ status: 'error', message: 'Job description cannot be empty.' });
    }

    const targetRole = job_role || 'Software Engineer';
    const resumeBuffer = req.file.buffer;
    const resumeText = await extractTextFromPDF(resumeBuffer);

    // Compute ML Match metrics
    const match = calculateMatch(resumeText, job_description.trim());

    // Generate AI feedback
    const feedback = await generateFeedback({
      matchResults: match,
      resumeText,
      jdText: job_description.trim(),
      jobRole: targetRole
    });

    const candidateName = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    return res.status(200).json({
      status: 'success',
      filename: req.file.originalname,
      candidate_name: candidateName,
      data: {
        final_match_pct: match.final_match_pct,
        skill_score_pct: match.skill_score_pct,
        context_score_pct: match.context_score_pct,
        matched_skills: match.matched_skills,
        missing_skills: match.missing_skills,
        feedback: feedback
      }
    });
  } catch (error) {
    console.error('Error in analyzeSingleResume:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Aggregated Analytics & Skill Demand Statistics
 */
exports.getAnalytics = async (req, res) => {
  try {
    let totalJobs = 0;
    let totalApplicants = 0;
    let avgMatchScore = 0;
    const skillCounts = {};

    if (isMongoConnected()) {
      totalJobs = await JobPosting.countDocuments();
      totalApplicants = await Application.countDocuments();

      const apps = await Application.find({}, 'final_match_pct matched_skills all_extracted_skills').lean();
      if (apps.length > 0) {
        const sumScores = apps.reduce((acc, a) => acc + (a.final_match_pct || 0), 0);
        avgMatchScore = parseFloat((sumScores / apps.length).toFixed(1));

        for (const app of apps) {
          const skills = app.all_extracted_skills || app.matched_skills || [];
          for (const s of skills) {
            const clean = s.trim().toLowerCase();
            skillCounts[clean] = (skillCounts[clean] || 0) + 1;
          }
        }
      }

      // Also aggregate from JobPostings required skills
      const jobs = await JobPosting.find({}, 'extracted_skills').lean();
      for (const job of jobs) {
        for (const s of (job.extracted_skills || [])) {
          const clean = s.trim().toLowerCase();
          skillCounts[clean] = (skillCounts[clean] || 0) + 2; // Weight JD required skills higher
        }
      }
    } else {
      totalJobs = memoryStore.jobs.length;
      totalApplicants = memoryStore.applications.length;
      if (totalApplicants > 0) {
        const sum = memoryStore.applications.reduce((acc, a) => acc + (a.final_match_pct || 0), 0);
        avgMatchScore = parseFloat((sum / totalApplicants).toFixed(1));

        for (const a of memoryStore.applications) {
          for (const s of (a.all_extracted_skills || a.matched_skills || [])) {
            const clean = s.trim().toLowerCase();
            skillCounts[clean] = (skillCounts[clean] || 0) + 1;
          }
        }
      }

      for (const j of memoryStore.jobs) {
        for (const s of (j.extracted_skills || [])) {
          const clean = s.trim().toLowerCase();
          skillCounts[clean] = (skillCounts[clean] || 0) + 2;
        }
      }
    }

    const topSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({
        name,
        count,
        demandPct: Math.min(100, Math.round((count / Math.max(1, totalJobs + totalApplicants)) * 100))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return res.status(200).json({
      status: 'success',
      data: {
        totalJobs,
        totalApplicants,
        avgMatchScore: avgMatchScore || 0,
        topSkills: topSkills
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};


