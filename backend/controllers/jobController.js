const JobPosting = require('../models/JobPosting');
const Application = require('../models/Application');
const { isMongoConnected, memoryStore } = require('../config/db');
const { extractTextFromPDF } = require('../services/pdfService');
const { extractSkills } = require('../services/skillExtractor');
const { calculateMatch } = require('../services/matcherService');
const { generateFeedback } = require('../services/geminiService');

/**
 * Recruiter creates a new Job Posting
 * Automatically extracts technical skills from the job description
 */
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      job_role,
      experience_level,
      location_type,
      salary_range,
      job_description,
      custom_skills
    } = req.body;

    if (!title || !job_role || !job_description) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, job role, and job description are required.'
      });
    }

    // Auto-extract required skills from the job description
    const autoSkills = extractSkills(job_description);
    const combinedSkills = Array.from(new Set([
      ...autoSkills,
      ...(Array.isArray(custom_skills) ? custom_skills.map(s => s.toLowerCase().trim()) : [])
    ]));

    const recruiterId = req.user ? req.user.id : null;
    const finalCompany = (req.user && req.user.company) ? req.user.company : (company ? company.trim() : '');

    const jobData = {
      title: title.trim(),
      company: finalCompany,
      recruiter_id: recruiterId,
      job_role: job_role.trim(),
      experience_level: experience_level || 'Mid',
      location_type: location_type || 'Remote',
      salary_range: salary_range || 'Competitive',
      job_description: job_description.trim(),
      extracted_skills: combinedSkills,
      status: 'active',
      createdAt: new Date()
    };

    let savedJob;
    if (isMongoConnected()) {
      savedJob = await JobPosting.create(jobData);
    } else {
      savedJob = { ...jobData, _id: 'job_' + Date.now() + Math.random().toString(36).substr(2, 5) };
      memoryStore.jobs.unshift(savedJob);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Job posting created successfully.',
      data: savedJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get all active Job Postings (with applicant counts)
 */
exports.getJobs = async (req, res) => {
  try {
    let jobs = [];
    if (isMongoConnected()) {
      jobs = await JobPosting.find().sort({ createdAt: -1 }).lean();
      
      // Attach applicant counts
      for (const job of jobs) {
        job.applicant_count = await Application.countDocuments({ job_id: job._id });
      }
    } else {
      jobs = memoryStore.jobs.map(job => ({
        ...job,
        applicant_count: memoryStore.applications.filter(a => a.job_id.toString() === job._id.toString()).length
      }));
    }

    return res.status(200).json({
      status: 'success',
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get single Job Posting by ID
 */
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    let job;
    if (isMongoConnected()) {
      job = await JobPosting.findById(id).lean();
    } else {
      job = memoryStore.jobs.find(j => j._id.toString() === id.toString());
    }

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job posting not found.' });
    }

    return res.status(200).json({ status: 'success', data: job });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Delete a Job Posting and its associated applications
 */
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      await JobPosting.findByIdAndDelete(id);
      await Application.deleteMany({ job_id: id });
    } else {
      memoryStore.jobs = memoryStore.jobs.filter(j => j._id.toString() !== id.toString());
      memoryStore.applications = memoryStore.applications.filter(a => a.job_id.toString() !== id.toString());
    }

    return res.status(200).json({ status: 'success', message: 'Job posting and associated applications removed.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Student uploads a resume and evaluates it against ALL active Job Postings
 * Returns all jobs with a personalized matching score %
 */
exports.matchJobsForResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a resume PDF file.' });
    }

    const resumeBuffer = req.file.buffer;
    const resumeText = await extractTextFromPDF(resumeBuffer);
    const resumeSkills = extractSkills(resumeText);

    // Retrieve active jobs
    let jobs = [];
    if (isMongoConnected()) {
      jobs = await JobPosting.find({ status: 'active' }).lean();
    } else {
      jobs = memoryStore.jobs.filter(j => j.status === 'active');
    }

    // Calculate match score for every job
    const evaluatedJobs = jobs.map(job => {
      const match = calculateMatch(resumeText, job.job_description);
      return {
        ...job,
        matchScore: match.final_match_pct,
        skillScore: match.skill_score_pct,
        contextScore: match.context_score_pct,
        matchedSkills: match.matched_skills,
        missingSkills: match.missing_skills,
      };
    });

    // Sort jobs from highest match to lowest match
    evaluatedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      status: 'success',
      resume_filename: req.file.originalname,
      extracted_candidate_skills: resumeSkills,
      total_jobs_evaluated: evaluatedJobs.length,
      data: evaluatedJobs
    });
  } catch (error) {
    console.error('Error evaluating jobs for resume:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Student applies to a specific job with resume
 * Computes full score + Gemini coaching feedback and persists the application
 */
exports.applyToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidate_name, candidate_email } = req.body;

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Resume PDF is required to apply.' });
    }

    // Retrieve job
    let job;
    if (isMongoConnected()) {
      job = await JobPosting.findById(id).lean();
    } else {
      job = memoryStore.jobs.find(j => j._id.toString() === id.toString());
    }

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Target job posting not found.' });
    }

    const resumeBuffer = req.file.buffer;
    const resumeText = await extractTextFromPDF(resumeBuffer);
    const match = calculateMatch(resumeText, job.job_description);

    // AI Coaching Feedback
    const feedback = await generateFeedback({
      matchResults: match,
      resumeText,
      jdText: job.job_description,
      jobRole: job.job_role
    });

    const candidateId = req.user ? req.user.id : null;
    const candidateEmail = (req.user && req.user.email) ? req.user.email : (candidate_email ? candidate_email.trim() : '');
    const parsedCandidateName = (req.user && req.user.name) 
      ? req.user.name
      : ((candidate_name && candidate_name.trim()) 
          ? candidate_name.trim() 
          : req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));

    const applicationData = {
      job_id: job._id,
      candidate_id: candidateId,
      candidate_name: parsedCandidateName,
      candidate_email: candidateEmail,
      resume_filename: req.file.originalname,
      final_match_pct: match.final_match_pct,
      skill_score_pct: match.skill_score_pct,
      context_score_pct: match.context_score_pct,
      genuine_score: feedback.genuine_score,
      matched_skills: match.matched_skills,
      missing_skills: match.missing_skills,
      all_extracted_skills: match.all_resume_skills,
      feedback: {
        summary: feedback.summary,
        improvement_tips: feedback.improvement_tips
      },
      status: 'Applied',
      recruiter_notes: '',
      createdAt: new Date()
    };

    let savedApp;
    if (isMongoConnected()) {
      savedApp = await Application.create(applicationData);
    } else {
      savedApp = { ...applicationData, _id: 'app_' + Date.now() + Math.random().toString(36).substr(2, 5) };
      memoryStore.applications.unshift(savedApp);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully.',
      data: savedApp
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Recruiter retrieves all applicants for a job, AUTOMATICALLY SORTED by match score DESC
 */
exports.getJobApplicants = async (req, res) => {
  try {
    const { id } = req.params;
    let applicants = [];

    if (isMongoConnected()) {
      applicants = await Application.find({ job_id: id })
        .sort({ final_match_pct: -1, createdAt: -1 })
        .lean();
    } else {
      applicants = memoryStore.applications
        .filter(a => a.job_id.toString() === id.toString())
        .sort((a, b) => b.final_match_pct - a.final_match_pct);
    }

    // Attach 1-based ranks
    const rankedApplicants = applicants.map((app, index) => ({
      rank: index + 1,
      ...app
    }));

    return res.status(200).json({
      status: 'success',
      total_applicants: rankedApplicants.length,
      data: rankedApplicants
    });
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Recruiter updates applicant status (Applied, Shortlisted, Reviewed, Rejected) & notes
 */
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const updateFields = {};
    if (status) {
      if (!['Applied', 'Shortlisted', 'Reviewed', 'Rejected'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid status value.' });
      }
      updateFields.status = status;
    }
    if (typeof notes === 'string') {
      updateFields.recruiter_notes = notes;
    }

    let updated;
    if (isMongoConnected()) {
      updated = await Application.findByIdAndUpdate(applicationId, updateFields, { new: true });
    } else {
      const idx = memoryStore.applications.findIndex(a => a._id.toString() === applicationId.toString());
      if (idx !== -1) {
        if (status) memoryStore.applications[idx].status = status;
        if (typeof notes === 'string') memoryStore.applications[idx].recruiter_notes = notes;
        updated = memoryStore.applications[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Recruiter exports job applicants leaderboard as a clean CSV
 */
exports.exportApplicantsCSV = async (req, res) => {
  try {
    const { id } = req.params;
    let applicants = [];

    if (isMongoConnected()) {
      applicants = await Application.find({ job_id: id }).sort({ final_match_pct: -1 }).lean();
    } else {
      applicants = memoryStore.applications
        .filter(a => a.job_id.toString() === id.toString())
        .sort((a, b) => b.final_match_pct - a.final_match_pct);
    }

    // Generate CSV Content
    const headers = ['Rank', 'Candidate Name', 'Email', 'Resume Filename', 'Match Score %', 'Skill Score %', 'Context Score %', 'Matched Skills', 'Missing Skills', 'Status', 'Recruiter Notes', 'Applied Date'];
    const rows = applicants.map((app, index) => [
      index + 1,
      `"${(app.candidate_name || '').replace(/"/g, '""')}"`,
      `"${(app.candidate_email || '').replace(/"/g, '""')}"`,
      `"${(app.resume_filename || '').replace(/"/g, '""')}"`,
      app.final_match_pct,
      app.skill_score_pct,
      app.context_score_pct,
      `"${(app.matched_skills || []).join(', ').replace(/"/g, '""')}"`,
      `"${(app.missing_skills || []).join(', ').replace(/"/g, '""')}"`,
      app.status || 'Applied',
      `"${(app.recruiter_notes || '').replace(/"/g, '""')}"`,
      new Date(app.createdAt).toISOString().split('T')[0]
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="applicants_leaderboard_${id}.csv"`);
    return res.status(200).send(csvString);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Recruiter bulk screens multiple resumes directly for a specific job
 */
exports.bulkScreenResumes = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please provide at least one PDF resume.' });
    }

    let job;
    if (isMongoConnected()) {
      job = await JobPosting.findById(id).lean();
    } else {
      job = memoryStore.jobs.find(j => j._id.toString() === id.toString());
    }

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job posting not found.' });
    }

    const processedCandidates = [];

    for (const file of files) {
      if (!file.originalname.toLowerCase().endsWith('.pdf')) continue;

      try {
        const text = await extractTextFromPDF(file.buffer);
        const match = calculateMatch(text, job.job_description);
        const candidateName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

        const appData = {
          job_id: job._id,
          candidate_name: candidateName,
          candidate_email: '',
          resume_filename: file.originalname,
          final_match_pct: match.final_match_pct,
          skill_score_pct: match.skill_score_pct,
          context_score_pct: match.context_score_pct,
          genuine_score: Math.round(match.final_match_pct),
          matched_skills: match.matched_skills,
          missing_skills: match.missing_skills,
          all_extracted_skills: match.all_resume_skills,
          feedback: {
            summary: `Automated bulk screen against ${job.title}.`,
            improvement_tips: match.missing_skills.length > 0 ? [`Address missing skill requirements: ${match.missing_skills.slice(0, 3).join(', ')}`] : ['Strong technical alignment.']
          },
          status: 'Applied',
          createdAt: new Date()
        };

        let saved;
        if (isMongoConnected()) {
          saved = await Application.create(appData);
        } else {
          saved = { ...appData, _id: 'app_' + Date.now() + Math.random().toString(36).substr(2, 5) };
          memoryStore.applications.unshift(saved);
        }

        processedCandidates.push(saved);
      } catch (err) {
        console.warn(`Failed to process ${file.originalname}:`, err.message);
      }
    }

    // Sort by final_match_pct DESC
    processedCandidates.sort((a, b) => b.final_match_pct - a.final_match_pct);

    return res.status(200).json({
      status: 'success',
      total_processed: processedCandidates.length,
      leaderboard: processedCandidates.map((c, i) => ({ rank: i + 1, ...c }))
    });
  } catch (error) {
    console.error('Error in bulk screening:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
