const mongoose = require('mongoose');

const JobPostingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  company: {
    type: String,
    default: '',
    trim: true,
  },
  recruiter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  job_role: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true,
  },
  experience_level: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead'],
    default: 'Mid',
  },
  location_type: {
    type: String,
    enum: ['Remote', 'Hybrid', 'On-site'],
    default: 'Remote',
  },
  salary_range: {
    type: String,
    default: 'Competitive',
  },
  job_description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  extracted_skills: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('JobPosting', JobPostingSchema);
