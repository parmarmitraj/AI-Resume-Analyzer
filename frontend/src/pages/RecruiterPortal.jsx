import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Users, 
  Award, 
  Search, 
  ArrowUpDown, 
  Building2, 
  MapPin, 
  Clock, 
  X, 
  FileText,
  Sparkles,
  ChevronRight,
  Download,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

export default function RecruiterPortal() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Job Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    job_role: '',
    experience_level: 'Mid',
    location_type: 'Remote',
    salary_range: '',
    job_description: ''
  });
  const [isCreatingJob, setIsCreatingJob] = useState(false);


  // Selected candidate detail modal
  const [viewingCandidate, setViewingCandidate] = useState(null);

  // Search filter
  const [applicantSearch, setApplicantSearch] = useState('');

  // Fetch all jobs for this recruiter's company
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await axios.get('/api/jobs');
      if (res.data && res.data.data) {
        setJobs(res.data.data);
        if (res.data.data.length > 0 && !selectedJob) {
          handleSelectJob(res.data.data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load jobs:', err.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  // Fetch applicants for selected job (automatically sorted by match score DESC by backend)
  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    try {
      const res = await axios.get(`/api/jobs/${job._id}/applicants`);
      if (res.data && res.data.data) {
        setApplicants(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch applicants:', err.message);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Create new job posting (company is automatically inherited from recruiter profile)
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.job_description) {
      alert('Please fill in Job Title and Description.');
      return;
    }

    setIsCreatingJob(true);
    try {
      const res = await axios.post('/api/jobs', newJob);
      if (res.data && res.data.data) {
        setJobs([res.data.data, ...jobs]);
        setSelectedJob(res.data.data);
        setApplicants([]);
        setShowCreateModal(false);
        setNewJob({
          title: '',
          job_role: '',
          experience_level: 'Mid',
          location_type: 'Remote',
          salary_range: '',
          job_description: ''
        });
      }
    } catch (err) {
      alert(`Error creating job: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsCreatingJob(false);
    }
  };

  // Delete job posting
  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this job posting and all its applicants?')) return;

    try {
      await axios.delete(`/api/jobs/${jobId}`);
      const updated = jobs.filter(j => j._id !== jobId);
      setJobs(updated);
      if (selectedJob?._id === jobId) {
        setSelectedJob(updated[0] || null);
        if (updated[0]) handleSelectJob(updated[0]);
        else setApplicants([]);
      }
    } catch (err) {
      alert('Failed to delete job posting.');
    }
  };


  // Update applicant review status & notes
  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.patch(`/api/applications/${appId}/status`, { status: newStatus });
      setApplicants(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.warn('Failed to update status:', err.message);
    }
  };

  const handleNotesUpdate = async (appId, newNotes) => {
    try {
      await axios.patch(`/api/applications/${appId}/status`, { notes: newNotes });
      setApplicants(prev => prev.map(a => a._id === appId ? { ...a, recruiter_notes: newNotes } : a));
    } catch (err) {
      console.warn('Failed to update notes:', err.message);
    }
  };

  // Export ranked applicants to CSV
  const handleExportCSV = async () => {
    if (!selectedJob) return;
    try {
      const res = await axios.get(`/api/jobs/${selectedJob._id}/export-csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applicants_${selectedJob.title.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  // Filtered applicants
  const filteredApplicants = applicants.filter(a =>
    a.candidate_name?.toLowerCase().includes(applicantSearch.toLowerCase()) ||
    a.resume_filename?.toLowerCase().includes(applicantSearch.toLowerCase()) ||
    (a.matched_skills && a.matched_skills.some(s => s.toLowerCase().includes(applicantSearch.toLowerCase())))
  );

  // If logged in as a candidate, show candidate-specific notice
  if (user?.role === 'candidate') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="clean-panel rounded-xl p-8 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Recruiter Hub Access</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              You are currently logged in as a <span className="text-emerald-400 font-semibold">Job Seeker / Candidate</span> ({user.email}). The Recruiter Hub is designated for hiring managers to publish openings and review applicant leaderboards.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <NavLink
              to="/jobs"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Explore Jobs as Candidate
            </NavLink>
            <NavLink
              to="/applications"
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
            >
              My Applications
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Job Creation Button */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Recruiter Command Hub
            </span>
            {user?.company && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                {user.company}
              </span>
            )}
            <span className="text-xs text-slate-400">Company Portal</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            {user?.company ? `${user.company} Job Openings & Leaderboard` : 'Job Postings & Applicant Leaderboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {user?.company 
              ? `Manage active positions and review ranked applicant leaderboards for ${user.company}.`
              : 'Post job openings and let the AI automatically rank all incoming student applicants by matching score.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Main Split Layout: Jobs Sidebar + Ranked Applicants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Job Postings List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {user?.company ? `${user.company} Openings` : 'Company Openings'} ({jobs.length})
            </h2>
          </div>

          {loadingJobs ? (
            <div className="p-8 text-center text-xs text-slate-400 clean-panel rounded-xl">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 clean-panel rounded-xl">
              No jobs posted yet for {user?.company || 'your company'}. Click "Post New Job" above.
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const isSelected = selectedJob?._id === job._id;
                return (
                  <div
                    key={job._id}
                    onClick={() => handleSelectJob(job)}
                    className={`clean-card rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-900/90 shadow-sm'
                        : 'hover:border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {job.company}
                        </span>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                          {job.title}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => handleDeleteJob(job._id, e)}
                        title="Delete job"
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-400" />
                        <span className="font-medium text-slate-200">
                          {job.applicant_count || 0}
                        </span> applicants
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {job.location_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Ranked Applicant Leaderboard for Selected Job (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedJob ? (
            <div className="clean-panel rounded-xl p-5 border border-slate-800 space-y-4">
              {/* Job Header Strip & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-400">
                    Leaderboard & Screening
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selectedJob.title}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedJob.company} • {selectedJob.location_type} • {selectedJob.experience_level} Level
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={applicants.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    placeholder="Search candidate by name, filename, or skill..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sorted by Match % (DESC)</span>
                </div>
              </div>

              {/* Leaderboard Table */}
              {loadingApplicants ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Loading applicant scores...
                </div>
              ) : filteredApplicants.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-medium text-slate-300">No applicants for this position yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Students who apply will automatically appear here sorted by their match score.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Candidate</th>
                        <th className="py-2.5 px-3">Match Score</th>
                        <th className="py-2.5 px-3">Skills Matched</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredApplicants.map((app, idx) => {
                        const rank = idx + 1;
                        const score = app.final_match_pct || 0;
                        const rankMedal = rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`;
                        
                        return (
                          <tr key={app._id} className="hover:bg-slate-900/50 transition-colors">
                            {/* Rank Medal */}
                            <td className="py-3 px-3 font-bold text-slate-300 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                rank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-extrabold' :
                                rank === 2 ? 'bg-slate-400/10 text-slate-300 border border-slate-500/30' :
                                rank === 3 ? 'bg-amber-700/10 text-amber-600 border border-amber-700/30' :
                                'text-slate-400'
                              }`}>
                                {rankMedal}
                              </span>
                            </td>

                            {/* Candidate Info */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white">{app.candidate_name}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                {app.resume_filename}
                              </div>
                            </td>

                            {/* Match Score & Progress Bar */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full rounded-full ${
                                      score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-indigo-400' : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold text-white text-xs">{score}%</span>
                              </div>
                            </td>

                            {/* Skills Matched count */}
                            <td className="py-3 px-3">
                              <span className="text-[11px] text-emerald-400 font-medium">
                                {app.matched_skills?.length || 0} matched
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {app.missing_skills?.length || 0} missing
                              </span>
                            </td>

                            {/* Status Selector */}
                            <td className="py-3 px-3">
                              <select
                                value={app.status || 'Applied'}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="Applied">Applied</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setViewingCandidate(app)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="clean-panel rounded-xl p-12 text-center text-xs text-slate-400">
              Select an active job opening from the left column to view its sorted applicant leaderboard.
            </div>
          )}
        </div>
      </div>

      {/* Candidate Details Modal */}
      {viewingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clean-panel max-w-lg w-full rounded-xl p-6 border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Candidate Evaluation
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{viewingCandidate.candidate_name}</h3>
                <p className="text-xs text-slate-400">{viewingCandidate.resume_filename}</p>
              </div>

              <button
                onClick={() => setViewingCandidate(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Band */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Match Score</span>
                <div className="text-lg font-bold text-emerald-400">{viewingCandidate.final_match_pct}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Skill Score</span>
                <div className="text-lg font-bold text-indigo-400">{viewingCandidate.skill_score_pct}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Context Score</span>
                <div className="text-lg font-bold text-purple-400">{viewingCandidate.context_score_pct}%</div>
              </div>
            </div>

            {/* Summary */}
            {viewingCandidate.feedback?.summary && (
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">Executive Summary</span>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {viewingCandidate.feedback.summary}
                </p>
              </div>
            )}

            {/* Recruiter Notes */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Internal Recruiter Notes</span>
              <textarea
                rows={2}
                value={viewingCandidate.recruiter_notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setViewingCandidate({ ...viewingCandidate, recruiter_notes: val });
                  handleNotesUpdate(viewingCandidate._id, val);
                }}
                placeholder="Add private evaluation notes (e.g. strong system design, follow up on Friday)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Skills */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 block mb-1.5">Matched Skills</span>
              <div className="flex flex-wrap gap-1">
                {(viewingCandidate.matched_skills || []).map((s, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-rose-400 block mb-1.5">Missing Requirements</span>
              <div className="flex flex-wrap gap-1">
                {(viewingCandidate.missing_skills || []).map((s, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/80">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setViewingCandidate(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post New Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clean-panel max-w-xl w-full rounded-xl p-6 border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Create New Job Posting</h3>
                <p className="text-xs text-slate-400">The AI will extract key skills from the job description automatically.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Job Role / Discipline *</label>
                <input
                  type="text"
                  required
                  value={newJob.job_role}
                  onChange={(e) => setNewJob({ ...newJob, job_role: e.target.value })}
                  placeholder="e.g. Frontend Engineer, ML Specialist, DevOps"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Experience</label>
                  <select
                    value={newJob.experience_level}
                    onChange={(e) => setNewJob({ ...newJob, experience_level: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior Level</option>
                    <option value="Lead">Lead / Architect</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Location</label>
                  <select
                    value={newJob.location_type}
                    onChange={(e) => setNewJob({ ...newJob, location_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                    placeholder="$100k - $130k"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Job Description *</label>
                <textarea
                  required
                  rows={6}
                  value={newJob.job_description}
                  onChange={(e) => setNewJob({ ...newJob, job_description: e.target.value })}
                  placeholder="Paste complete job description requirements here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingJob}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  {isCreatingJob ? 'Creating...' : 'Publish Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
