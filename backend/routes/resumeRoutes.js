const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');
const { getDBStatus } = require('../config/db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.post('/student/analyze', upload.single('resume'), resumeController.analyzeSingleResume);

router.post('/analyze', upload.single('resume'), resumeController.analyzeSingleResume);

router.post('/auditor/analyze-bulk', upload.array('resumes', 30), resumeController.analyzeMultipleResumes);

router.get('/analytics', resumeController.getAnalytics);

router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Resume Analyzer & Job Portal Backend (MERN)',
    version: '2.0.0',
    database: getDBStatus()
  });
});

module.exports = router;
