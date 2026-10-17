const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');
const { getDBStatus } = require('../config/db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Standalone Student Analysis against custom JD
router.post('/student/analyze', upload.single('resume'), resumeController.analyzeSingleResume);

// Also alias /analyze for backward compatibility with frontend Dashboard
router.post('/analyze', upload.single('resume'), resumeController.analyzeSingleResume);

// Analytics & Insights
router.get('/analytics', resumeController.getAnalytics);

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Resume Analyzer & Job Portal Backend (MERN)',
    version: '2.0.0',
    database: getDBStatus()
  });
});

module.exports = router;
