const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ai_resume_analyzer_jwt_secret_key_2026';

/**
 * Middleware to enforce authenticated JWT on protected endpoints
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Authentication token required.'
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid, malformed, or expired token.'
    });
  }
};

/**
 * Optional authentication: if token exists, populates req.user; otherwise continues anonymously
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
    } catch (err) {
      // Ignore token failure for optional endpoints
    }
  }
  next();
};

/**
 * Enforces role restriction (e.g. 'recruiter' or 'candidate')
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden. Action requires ${role} privileges.`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
