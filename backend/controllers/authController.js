const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Application = require('../models/Application');
const JobPosting = require('../models/JobPosting');
const { isMongoConnected, memoryStore } = require('../config/db');
const { extractTextFromPDF } = require('../services/pdfService');
const { extractSkills } = require('../services/skillExtractor');
const { JWT_SECRET } = require('../middleware/auth');

// In-memory users store fallback if MongoDB is not running
if (!memoryStore.users) {
  memoryStore.users = [];
}

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      company: user.company || ''
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Register candidate or recruiter
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRole = role === 'recruiter' ? 'recruiter' : 'candidate';

    if (isMongoConnected()) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: userRole,
        company: company ? company.trim() : ''
      });

      const token = generateToken(user);
      return res.status(201).json({
        status: 'success',
        message: 'Account created successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          saved_resume_filename: user.saved_resume_filename,
          extracted_skills: user.extracted_skills
        }
      });
    } else {
      const existing = memoryStore.users.find(u => u.email === cleanEmail);
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        _id: 'user_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: userRole,
        company: company ? company.trim() : '',
        saved_resume_filename: '',
        saved_resume_text: '',
        extracted_skills: [],
        createdAt: new Date()
      };
      memoryStore.users.push(user);

      const token = generateToken(user);
      return res.status(201).json({
        status: 'success',
        message: 'Account created successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          saved_resume_filename: '',
          extracted_skills: []
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Login candidate or recruiter
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user;
    let isPasswordMatch = false;

    if (isMongoConnected()) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      }
      isPasswordMatch = await user.comparePassword(password);
    } else {
      user = memoryStore.users.find(u => u.email === cleanEmail);
      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      }
      isPasswordMatch = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        saved_resume_filename: user.saved_resume_filename || '',
        extracted_skills: user.extracted_skills || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get current authenticated user profile
 */
exports.getMe = async (req, res) => {
  try {
    let user;
    if (isMongoConnected()) {
      user = await User.findById(req.user.id).select('-password').lean();
    } else {
      user = memoryStore.users.find(u => u._id.toString() === req.user.id.toString());
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({ status: 'success', user });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Candidate uploads and saves resume to persistent Profile Locker
 * ("Upload Once, Match Everywhere")
 */
exports.saveResumeProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a PDF resume file.' });
    }

    const resumeBuffer = req.file.buffer;
    const resumeText = await extractTextFromPDF(resumeBuffer);
    const skills = extractSkills(resumeText);

    let updatedUser;
    if (isMongoConnected()) {
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          saved_resume_filename: req.file.originalname,
          saved_resume_text: resumeText,
          extracted_skills: skills
        },
        { new: true }
      ).select('-password');
    } else {
      const idx = memoryStore.users.findIndex(u => u._id.toString() === req.user.id.toString());
      if (idx !== -1) {
        memoryStore.users[idx].saved_resume_filename = req.file.originalname;
        memoryStore.users[idx].saved_resume_text = resumeText;
        memoryStore.users[idx].extracted_skills = skills;
        const { password, ...safe } = memoryStore.users[idx];
        updatedUser = safe;
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Resume profile locker updated successfully.',
      filename: req.file.originalname,
      extracted_skills: skills,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error saving resume profile:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Candidate fetches "My Applications" history with live recruiter review statuses
 */
exports.getMyApplications = async (req, res) => {
  try {
    let applications = [];

    if (isMongoConnected()) {
      applications = await Application.find({
        $or: [
          { candidate_id: req.user.id },
          { candidate_email: req.user.email }
        ]
      })
        .populate('job_id', 'title company location_type job_role salary_range')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      applications = memoryStore.applications
        .filter(a => a.candidate_id?.toString() === req.user.id.toString() || a.candidate_email === req.user.email)
        .map(a => {
          const job = memoryStore.jobs.find(j => j._id.toString() === a.job_id.toString());
          return {
            ...a,
            job_id: job ? {
              title: job.title,
              company: job.company,
              location_type: job.location_type,
              job_role: job.job_role,
              salary_range: job.salary_range
            } : null
          };
        });
    }

    return res.status(200).json({
      status: 'success',
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching candidate applications:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
