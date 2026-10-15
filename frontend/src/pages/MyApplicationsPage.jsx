import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function MyApplicationsPage() {
  const { user, uploadResumeToProfile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingResume, setIsUpdatingResume] = useState(false);
  const [resumeUpdateSuccess, setResumeUpdateSuccess] = useState('');

  // Fetch applications
  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/auth/my-applications');
      if (res.data && res.data.data) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch user applications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  // Update persistent resume
  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingResume(true);
    setResumeUpdateSuccess('');
    try {
      await uploadResumeToProfile(file);
      setResumeUpdateSuccess(`Updated persistent resume: ${file.name}`);
      setTimeout(() => setResumeUpdateSuccess(''), 5000);
    } catch (err) {
      alert(`Failed to update resume: ${err.message}`);
    } finally {
      setIsUpdatingResume(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Title */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800">
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Candidate Portal
        </span>
        <h1 className="text-xl font-bold text-white mt-1">My Applications & Profile Locker</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track the live review status of jobs you've applied to and manage your persistent resume profile.
        </p>
      </div>

      {/* Persistent Resume Locker Card */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Persistent Resume Locker</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Your saved resume is automatically used across all jobs for instantaneous match calculations.
            </p>
          </div>

          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUpdatingResume ? 'Uploading...' : user?.saved_resume_filename ? 'Update Resume PDF' : 'Upload Resume to Profile'}</span>
            <input 
              type="file" 
              accept=".pdf" 
              disabled={isUpdatingResume}
              onChange={handleResumeChange} 
              className="hidden" 
            />
          </label>
        </div>

        {resumeUpdateSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{resumeUpdateSuccess}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400">Current Saved File:</span>
          <span className="font-medium text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {user?.saved_resume_filename || 'No resume saved yet.'}
          </span>
        </div>

        {user?.extracted_skills && user.extracted_skills.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-slate-400 block font-medium">Extracted Profile Skills ({user.extracted_skills.length}):</span>
            <div className="flex flex-wrap gap-1.5">
              {user.extracted_skills.map((skill, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Applications Table */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Submitted Applications ({applications.length})</h2>
            <p className="text-xs text-slate-400">Recruiters update candidate statuses in real time</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
            <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-300">You haven't applied to any positions yet.</p>
            <p className="text-[11px] text-slate-500">Go to the Jobs portal to match and apply with one click.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">Applied Date</th>
                  <th className="py-2.5 px-3">Match Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Missing Requirements</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {applications.map((app) => {
                  const job = app.job_id || {};
                  const score = app.final_match_pct || 0;
                  const status = app.status || 'Applied';

                  const statusClass = 
                    status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    status === 'Reviewed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                    status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <tr key={app._id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Job Title & Company */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{job.title || 'Technical Role'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{job.company || 'TechCorp'}</span>
                          <span>•</span>
                          <span>{job.location_type || 'Remote'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(app.createdAt).toISOString().split('T')[0]}
                      </td>

                      {/* Match Score */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          score >= 80 ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80' :
                          score >= 60 ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80' :
                          'bg-amber-950/60 text-amber-300 border-amber-800/80'
                        }`}>
                          {score}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusClass}`}>
                          {status}
                        </span>
                      </td>

                      {/* Missing requirements */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(app.missing_skills || []).slice(0, 3).map((s, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/40 text-rose-300 border border-rose-900/60">
                              {s}
                            </span>
                          ))}
                          {(app.missing_skills || []).length > 3 && (
                            <span className="text-[10px] text-slate-500">+{app.missing_skills.length - 3}</span>
                          )}
                          {(app.missing_skills || []).length === 0 && (
                            <span className="text-[11px] text-emerald-400">None! All matched</span>
                          )}
                        </div>
                      </td>

                      {/* Recruiter Notes */}
                      <td className="py-3 px-3 text-slate-400 max-w-[180px] truncate">
                        {app.recruiter_notes || <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
