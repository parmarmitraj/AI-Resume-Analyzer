const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobController = require('../controllers/jobController');
const { optionalAuth, requireRole } = require('../middleware/auth');

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size
});

// Job Posting CRUD
router.post('/jobs', optionalAuth, jobController.createJob);
router.get('/jobs', optionalAuth, jobController.getJobs);
router.get('/jobs/:id', jobController.getJobById);
router.delete('/jobs/:id', optionalAuth, jobController.deleteJob);

// Student match resume against all active jobs
router.post('/student/match-jobs', optionalAuth, upload.single('resume'), jobController.matchJobsForResume);

// Student apply to specific job
router.post('/jobs/:id/apply', optionalAuth, upload.single('resume'), jobController.applyToJob);

// Recruiter view applicants for job (sorted by match score DESC)
router.get('/jobs/:id/applicants', optionalAuth, jobController.getJobApplicants);

// Recruiter export applicants as CSV
router.get('/jobs/:id/export-csv', optionalAuth, jobController.exportApplicantsCSV);

// Recruiter update applicant status & notes
router.patch('/applications/:applicationId/status', optionalAuth, jobController.updateApplicantStatus);

// Recruiter bulk screening directly into a job
router.post('/jobs/:id/bulk-screen', optionalAuth, upload.array('resumes', 30), jobController.bulkScreenResumes);

module.exports = router;
