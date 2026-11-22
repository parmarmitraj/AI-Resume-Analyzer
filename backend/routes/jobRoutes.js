const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobController = require('../controllers/jobController');
const { optionalAuth, requireRole } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } 
});

router.post('/jobs', optionalAuth, jobController.createJob);
router.get('/jobs', optionalAuth, jobController.getJobs);
router.get('/jobs/:id', jobController.getJobById);
router.delete('/jobs/:id', optionalAuth, jobController.deleteJob);

router.post('/student/match-jobs', optionalAuth, upload.single('resume'), jobController.matchJobsForResume);

router.post('/jobs/:id/apply', optionalAuth, upload.single('resume'), jobController.applyToJob);

router.get('/jobs/:id/applicants', optionalAuth, jobController.getJobApplicants);

router.get('/jobs/:id/export-csv', optionalAuth, jobController.exportApplicantsCSV);

router.patch('/applications/:applicationId/status', optionalAuth, jobController.updateApplicantStatus);

router.post('/jobs/:id/bulk-screen', optionalAuth, upload.array('resumes', 30), jobController.bulkScreenResumes);

module.exports = router;
