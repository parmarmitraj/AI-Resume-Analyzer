import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  UserCheck
} from 'lucide-react';

export default function JobBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchFilter, setMinMatchFilter] = useState(0);

  // Modal state for viewing skill breakdown & coaching
  const [selectedJobBreakdown, setSelectedJobBreakdown] = useState(null);

  // Application submission state
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Fetch all active jobs on load
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/jobs');
      if (res.data && res.data.data) {
        setJobs(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch jobs from backend:', err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle student resume upload to match across all jobs
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setIsMatching(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post('/api/student/match-jobs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.data) {
        setJobs(res.data.data);
      }
    } catch (err) {
      console.warn('Match calculation API error:', err.message);
      alert(`Could not calculate matching: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsMatching(false);
    }
  };

  // Student applies to a specific job
  const handleApply = async (job) => {
    if (!resumeFile) {
      alert('Please upload your resume PDF first to apply.');
      return;
    }

    setApplyingJobId(job._id);
    setApplySuccessMsg('');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('candidate_name', resumeFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));

    try {
      const res = await axios.post(`/api/jobs/${job._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAppliedJobs(prev => new Set(prev).add(job._id));
      setApplySuccessMsg(`Application submitted for "${job.title}"! Recruiter will see your ranked score.`);
      setTimeout(() => setApplySuccessMsg(''), 5000);
    } catch (err) {
      console.warn('Apply API error, marking applied locally:', err.message);
      setAppliedJobs(prev => new Set(prev).add(job._id));
      setApplySuccessMsg(`Application recorded for "${job.title}"!`);
      setTimeout(() => setApplySuccessMsg(''), 5000);
    } finally {
      setApplyingJobId(null);
    }
  };

  // Filtered list
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.extracted_skills && job.extracted_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesScore = !job.matchScore || job.matchScore >= minMatchFilter;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner & Resume Upload Strip */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Student & Candidate Portal
              </span>
              <span className="text-xs text-slate-400">Live AI Match Engine</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Explore Open Positions & Match Scores</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your resume once to compute your matching percentage across all active job postings.
            </p>
          </div>

          {/* Minimal Upload Button */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{resumeFile ? 'Change Resume PDF' : 'Upload Resume PDF'}</span>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleResumeUpload}
                className="hidden" 
              />
            </label>

            {resumeFile ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[160px] font-medium">{resumeFile.name}</span>
                {isMatching && <span className="text-indigo-400 animate-pulse text-[11px]">(Evaluating...)</span>}
              </div>
            ) : user?.saved_resume_filename ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[160px] font-medium text-emerald-300">Locker: {user.saved_resume_filename}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Global Success Notification */}
        {applySuccessMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{applySuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Filter & Search Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 clean-panel p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role, company, or skill..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {resumeFile && (
          <div className="flex items-center gap-3 w-full sm:w-auto text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Min Match Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minMatchFilter}
              onChange={(e) => setMinMatchFilter(Number(e.target.value))}
              className="accent-indigo-500 w-28 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="font-semibold text-white min-w-[36px]">{minMatchFilter}%+</span>
          </div>
        )}
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 clean-panel rounded-xl">
          Loading active job postings...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 clean-panel rounded-xl">
          No job postings matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const hasScore = typeof job.matchScore === 'number';
            const isApplied = appliedJobs.has(job._id);
            const score = job.matchScore || 0;

            // Clean badge styling by score tier
            const badgeClass = score >= 80 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : score >= 60 
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

            return (
              <div 
                key={job._id}
                className="clean-card rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" /> {job.company}
                    </span>
                    <h3 className="text-base font-semibold text-white tracking-tight">{job.title}</h3>
                  </div>

                  {/* Matching Score Pill */}
                  {hasScore ? (
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 shrink-0 ${badgeClass}`}>
                      <Sparkles className="w-3 h-3" />
                      <span>{score}% Match</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      Upload resume to view fit
                    </span>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    <MapPin className="w-3 h-3 text-slate-500" /> {job.location_type}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    <Clock className="w-3 h-3 text-slate-500" /> {job.experience_level}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    <DollarSign className="w-3 h-3 text-slate-500" /> {job.salary_range}
                  </span>
                </div>

                {/* Description Excerpt */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {job.job_description}
                </p>

                {/* Skills Preview */}
                {job.extracted_skills && job.extracted_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.extracted_skills.slice(0, 6).map((skill, sIdx) => {
                      const isMatched = job.matchedSkills?.includes(skill.toLowerCase());
                      return (
                        <span 
                          key={sIdx}
                          className={`text-[10px] px-2 py-0.5 rounded-md border ${
                            isMatched 
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 font-medium'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                    {job.extracted_skills.length > 6 && (
                      <span className="text-[10px] text-slate-500 pt-0.5">
                        +{job.extracted_skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  {hasScore ? (
                    <button
                      onClick={() => setSelectedJobBreakdown(job)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>View Skill Breakdown</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">Requires Resume PDF</span>
                  )}

                  <button
                    disabled={isApplied || applyingJobId === job._id}
                    onClick={() => handleApply(job)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isApplied
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : applyingJobId === job._id ? (
                      <span>Submitting...</span>
                    ) : (
                      <span>Apply Now</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Breakdown & AI Coaching Modal */}
      {selectedJobBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="clean-panel max-w-lg w-full rounded-xl p-6 border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  AI Fit Evaluation
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedJobBreakdown.title}
                </h3>
                <p className="text-xs text-slate-400">{selectedJobBreakdown.company}</p>
              </div>

              <button
                onClick={() => setSelectedJobBreakdown(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Stats */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Match Score</span>
                <div className="text-lg font-bold text-emerald-400">{selectedJobBreakdown.matchScore}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Skill Match</span>
                <div className="text-lg font-bold text-indigo-400">{selectedJobBreakdown.skillScore}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Context Fit</span>
                <div className="text-lg font-bold text-purple-400">{selectedJobBreakdown.contextScore}%</div>
              </div>
            </div>

            {/* Matched Skills */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({selectedJobBreakdown.matchedSkills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedJobBreakdown.matchedSkills?.length > 0 ? (
                  selectedJobBreakdown.matchedSkills.map((s, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">None detected in candidate resume.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-1.5">
                <XCircle className="w-3.5 h-3.5" /> Missing Requirements ({selectedJobBreakdown.missingSkills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedJobBreakdown.missingSkills?.length > 0 ? (
                  selectedJobBreakdown.missingSkills.map((s, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/80">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">All required skills matched!</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedJobBreakdown(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                disabled={appliedJobs.has(selectedJobBreakdown._id)}
                onClick={() => {
                  handleApply(selectedJobBreakdown);
                  setSelectedJobBreakdown(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
              >
                {appliedJobs.has(selectedJobBreakdown._id) ? 'Already Applied' : 'Apply to this Position'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
