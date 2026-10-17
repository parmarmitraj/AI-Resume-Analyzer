const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);

// Candidate Profile Locker & Applications
router.post('/resume-profile', authenticateToken, upload.single('resume'), authController.saveResumeProfile);
router.get('/my-applications', authenticateToken, authController.getMyApplications);

module.exports = router;
