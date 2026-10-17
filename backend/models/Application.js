const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true,
    index: true,
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  candidate_name: {
    type: String,
    required: true,
    trim: true,
  },
  candidate_email: {
    type: String,
    default: '',
    trim: true,
  },
  resume_filename: {
    type: String,
    required: true,
  },
  final_match_pct: {
    type: Number,
    required: true,
    index: -1, // Descending index for sorting leaderboard
  },
  skill_score_pct: {
    type: Number,
    required: true,
  },
  context_score_pct: {
    type: Number,
    required: true,
  },
  genuine_score: {
    type: Number,
    default: null,
  },
  matched_skills: {
    type: [String],
    default: [],
  },
  missing_skills: {
    type: [String],
    default: [],
  },
  all_extracted_skills: {
    type: [String],
    default: [],
  },
  feedback: {
    summary: { type: String, default: '' },
    improvement_tips: { type: [String], default: [] },
  },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Reviewed', 'Rejected'],
    default: 'Applied',
    index: true,
  },
  recruiter_notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Application', ApplicationSchema);
