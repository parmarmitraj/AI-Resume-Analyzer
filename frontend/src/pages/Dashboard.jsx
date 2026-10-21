import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ResumeUploader from '../components/ResumeUploader';
import JobDescriptionInput from '../components/JobDescriptionInput';
import AnalysisResults from '../components/AnalysisResults';
import { 
  Sparkles, 
  Users, 
  Award, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  X, 
  Layers, 
  ArrowUpDown, 
  FileText,
  BarChart3,
  HelpCircle,
  Briefcase
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'recruiter';

  // Candidate mode state
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Recruiter mode state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [bulkResults, setBulkResults] = useState(null);
  const [selectedCandidateModal, setSelectedCandidateModal] = useState(null);
  const [sortField, setSortField] = useState('rank'); // 'rank', 'matchScore', 'skillScore', 'contextScore'
  const [filterTier, setFilterTier] = useState('all'); // 'all', 'high' (>=75), 'medium' (<75)

  // Common state
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null); // single candidate result
  const [errorMsg, setErrorMsg] = useState(null);

  /* ------------------- SINGLE RESUME ANALYSIS (CANDIDATE) ------------------- */
  const handleSingleAnalyze = async () => {
    if (!selectedFile || !jobDescription.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('job_description', jobDescription.trim());
    formData.append('job_role', jobRole || 'Software Engineer');

    try {
      const response = await axios.post('/api/student/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      if (response.data && response.data.status === 'success') {
        const payload = response.data.data;
        const feedbackObj = payload.feedback || {};

        const formattedResults = {
          id: Date.now(),
          fileName: selectedFile.name,
          candidateName: response.data.candidate_name || selectedFile.name.replace(/\.[^/.]+$/, ""),
          matchScore: payload.final_match_pct || 0,
          skillScore: payload.skill_score_pct || 0,
          contextScore: payload.context_score_pct || 0,
          genuineScore: feedbackObj.genuine_score || payload.final_match_pct,
          extractedSkills: payload.matched_skills || [],
          missingSkills: payload.missing_skills || [],
          summary: feedbackObj.summary || "Evaluation completed successfully.",
          feedback: Array.isArray(feedbackObj.improvement_tips) ? feedbackObj.improvement_tips : [],
          date: new Date().toISOString().split('T')[0]
        };

        setResults(formattedResults);
      } else {
        throw new Error(response.data?.message || 'Invalid API response format');
      }
    } catch (error) {
      console.warn('API error:', error.message);
      setErrorMsg(error.response?.data?.message || error.message || 'Evaluation failed. Please check the backend connection.');
      setResults(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ------------------- BULK RESUME SCREENING (RECRUITER) ------------------- */
  const handleBulkAnalyze = async () => {
    if (selectedFiles.length === 0 || !jobDescription.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('resumes', file);
    });
    formData.append('job_description', jobDescription.trim());
    formData.append('job_role', jobRole.trim() || 'Software Engineer');

    try {
      const response = await axios.post('/api/auditor/analyze-bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });

      if (response.data && response.data.status === 'success') {
        setBulkResults(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to screen resumes.');
      }
    } catch (error) {
      console.warn('Bulk Screening API error:', error.message);
      setErrorMsg(error.response?.data?.message || error.message || 'Bulk evaluation failed. Please verify that the backend is running.');
      setBulkResults(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ------------------- EXPORT CSV LEADERBOARD ------------------- */
  const exportToCSV = () => {
    if (!bulkResults || bulkResults.length === 0) return;

    const headers = ['Rank', 'Candidate Name', 'File Name', 'Overall Match %', 'Skill Score %', 'Context Score %', 'Matched Skills', 'Missing Skills'];
    const rows = bulkResults.map(c => [
      c.rank,
      `"${(c.candidateName || '').replace(/"/g, '""')}"`,
      `"${(c.fileName || '').replace(/"/g, '""')}"`,
      c.matchScore,
      c.skillScore,
      c.contextScore,
      `"${(c.extractedSkills || []).join('; ')}"`,
      `"${(c.missingSkills || []).join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `screened_candidates_ranked_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort for recruiter bulk list
  const filteredBulkResults = (bulkResults || []).filter(c => {
    if (filterTier === 'high') return c.matchScore >= 75;
    if (filterTier === 'medium') return c.matchScore < 75;
    return true;
  }).sort((a, b) => {
    if (sortField === 'matchScore') return b.matchScore - a.matchScore;
    if (sortField === 'skillScore') return b.skillScore - a.skillScore;
    if (sortField === 'contextScore') return b.contextScore - a.contextScore;
    return a.rank - b.rank; // default rank asc
  });

  const avgBatchScore = bulkResults && bulkResults.length > 0
    ? Math.round(bulkResults.reduce((sum, c) => sum + (c.matchScore || 0), 0) / bulkResults.length)
    : 0;

  const topMatchScore = bulkResults && bulkResults.length > 0
    ? bulkResults[0]?.matchScore || 0
    : 0;

  const highMatchCount = bulkResults
    ? bulkResults.filter(c => c.matchScore >= 75).length
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
            isRecruiter 
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}>
            {isRecruiter ? 'Recruiter Multi-Resume Screener' : 'Ad-Hoc Evaluation'}
          </span>
          <h1 className="text-xl font-bold text-white mt-1">
            {isRecruiter ? 'Resume Auditor & Bulk Candidate Screener' : 'Standalone Resume Auditor'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            {isRecruiter 
              ? 'Upload multiple candidate resumes simultaneously to audit and rank them against any job description with dual-pronged semantic analysis.' 
              : 'Paste any custom job description and upload a resume PDF to run full dual-pronged matching and receive AI coaching recommendations.'}
          </p>
        </div>

        {isRecruiter && bulkResults && bulkResults.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors shadow-sm shrink-0 self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Leaderboard (.CSV)</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & JD Input */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Role input (optional helper for recruiter) */}
          {isRecruiter && (
            <div className="clean-panel p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Target Job Role / Title
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Uploader (Multi for recruiter, single for candidate) */}
          <ResumeUploader 
            isMultiple={isRecruiter}
            selectedFile={selectedFile} 
            setSelectedFile={setSelectedFile}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
          />

          {/* Job Description Input & Analyze Trigger */}
          <JobDescriptionInput 
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            onAnalyze={isRecruiter ? handleBulkAnalyze : handleSingleAnalyze}
            isAnalyzing={isAnalyzing}
            disabled={isRecruiter ? (selectedFiles.length === 0 || !jobDescription.trim()) : (!selectedFile || !jobDescription.trim())}
          />
        </div>

        {/* Right Column: Results Display */}
        <div className="lg:col-span-7">
          {/* CANDIDATE MODE: Single Resume Result */}
          {!isRecruiter && (
            <AnalysisResults results={results} />
          )}

          {/* RECRUITER MODE: Bulk Screening Leaderboard */}
          {isRecruiter && (
            <div>
              {!bulkResults ? (
                /* Empty State */
                <div className="h-full min-h-[420px] clean-panel rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 border border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-base font-semibold text-white">No Resumes Screened Yet</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Upload candidate PDF resumes on the left, paste the target job description requirements, and click <span className="text-indigo-400 font-medium">Run AI Match</span> to generate a ranked candidate leaderboard with skill gap analysis.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm pt-2">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                      <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-[11px] font-semibold text-slate-200">Rank Scoring</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                      <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                      <span className="text-[11px] font-semibold text-slate-200">AI Deep Dive</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                      <Download className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-[11px] font-semibold text-slate-200">CSV Export</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Bulk Screening Leaderboard Results */
                <div className="space-y-4">
                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="clean-panel p-3 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Screened</span>
                      <span className="text-xl font-bold text-white mt-0.5 block">{bulkResults.length}</span>
                    </div>
                    <div className="clean-panel p-3 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Score</span>
                      <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{topMatchScore}%</span>
                    </div>
                    <div className="clean-panel p-3 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average Match</span>
                      <span className="text-xl font-bold text-indigo-400 mt-0.5 block">{avgBatchScore}%</span>
                    </div>
                    <div className="clean-panel p-3 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Matches</span>
                      <span className="text-xl font-bold text-purple-400 mt-0.5 block">{highMatchCount}</span>
                    </div>
                  </div>

                  {/* Filter & Sort Controls */}
                  <div className="clean-panel px-4 py-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Filter:</span>
                      <button
                        onClick={() => setFilterTier('all')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          filterTier === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                        }`}
                      >
                        All ({bulkResults.length})
                      </button>
                      <button
                        onClick={() => setFilterTier('high')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          filterTier === 'high' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                        }`}
                      >
                        High (≥75%)
                      </button>
                      <button
                        onClick={() => setFilterTier('medium')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          filterTier === 'medium' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                        }`}
                      >
                        Review (&lt;75%)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3" /> Sort:
                      </span>
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="rank">By Rank (#1 first)</option>
                        <option value="matchScore">Overall Match %</option>
                        <option value="skillScore">Skill Score %</option>
                        <option value="contextScore">Context Score %</option>
                      </select>
                    </div>
                  </div>

                  {/* Candidate Ranked Cards List */}
                  <div className="space-y-3">
                    {filteredBulkResults.length === 0 ? (
                      <div className="p-6 rounded-xl clean-panel border border-slate-800 text-center text-xs text-slate-400">
                        No candidates match the selected filter.
                      </div>
                    ) : (
                      filteredBulkResults.map((candidate) => {
                        const score = candidate.matchScore || 0;
                        const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-indigo-400' : 'text-amber-400';
                        const scoreBadgeBg = score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 60 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-amber-500/10 border-amber-500/30';

                        // Rank badge styling
                        const isGold = candidate.rank === 1;
                        const isSilver = candidate.rank === 2;
                        const isBronze = candidate.rank === 3;

                        return (
                          <div 
                            key={candidate.id}
                            className={`clean-panel p-4 rounded-xl border transition-all hover:border-slate-700 ${
                              isGold ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-slate-800'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              {/* Candidate Info & Rank */}
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isGold 
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                                    : isSilver 
                                    ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                                    : isBronze
                                    ? 'bg-amber-700/20 text-amber-500 border border-amber-600/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {isGold ? '🥇1' : isSilver ? '🥈2' : isBronze ? '🥉3' : `#${candidate.rank}`}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-white truncate">
                                      {candidate.candidateName}
                                    </h4>
                                    {isGold && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                        Top Candidate
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                                    {candidate.fileName}
                                  </p>
                                </div>
                              </div>

                              {/* Scores & Inspect Action */}
                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                <div className={`px-2.5 py-1 rounded-lg border text-center ${scoreBadgeBg}`}>
                                  <span className={`text-base font-extrabold ${scoreColor}`}>
                                    {candidate.matchScore}%
                                  </span>
                                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Match</span>
                                </div>

                                <div className="hidden sm:block text-[11px] text-slate-400 border-l border-slate-800 pl-3 space-y-0.5">
                                  <div>Skills: <span className="text-white font-medium">{candidate.skillScore}%</span></div>
                                  <div>Context: <span className="text-white font-medium">{candidate.contextScore}%</span></div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedCandidateModal(candidate)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-colors flex items-center gap-1.5 ml-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>
                              </div>
                            </div>

                            {/* Skills breakdown chips preview */}
                            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-500 font-medium">Matched:</span>
                              {(candidate.extractedSkills || []).slice(0, 4).map((skill, sIdx) => (
                                <span key={sIdx} className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
                                  {skill}
                                </span>
                              ))}
                              {(candidate.extractedSkills || []).length > 4 && (
                                <span className="text-slate-500 text-[10px]">
                                  +{(candidate.extractedSkills || []).length - 4} more
                                </span>
                              )}

                              {(candidate.missingSkills || []).length > 0 && (
                                <>
                                  <span className="text-slate-500 font-medium ml-2">Missing:</span>
                                  {(candidate.missingSkills || []).slice(0, 2).map((skill, sIdx) => (
                                    <span key={sIdx} className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60">
                                      {skill}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recruiter Candidate Deep Dive Inspection Modal */}
      {selectedCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="clean-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 border border-slate-700 bg-[#0d1322] shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Rank #{selectedCandidateModal.rank}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedCandidateModal.candidateName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  File: {selectedCandidateModal.fileName}
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidateModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overall Match</span>
                <span className={`text-2xl font-black mt-0.5 block ${
                  selectedCandidateModal.matchScore >= 80 ? 'text-emerald-400' : selectedCandidateModal.matchScore >= 60 ? 'text-indigo-400' : 'text-amber-400'
                }`}>
                  {selectedCandidateModal.matchScore}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Skill Match</span>
                <span className="text-2xl font-black text-white mt-0.5 block">
                  {selectedCandidateModal.skillScore}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Context Match</span>
                <span className="text-2xl font-black text-white mt-0.5 block">
                  {selectedCandidateModal.contextScore}%
                </span>
              </div>
            </div>

            {/* AI Summary */}
            {selectedCandidateModal.summary && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Executive Screening Summary
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCandidateModal.summary}
                </p>
              </div>
            )}

            {/* Skills Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matched Skills */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({(selectedCandidateModal.extractedSkills || []).length})
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {(selectedCandidateModal.extractedSkills || []).length > 0 ? (
                    selectedCandidateModal.extractedSkills.map((s, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/80">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Missing Skills ({(selectedCandidateModal.missingSkills || []).length})
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {(selectedCandidateModal.missingSkills || []).length > 0 ? (
                    selectedCandidateModal.missingSkills.map((s, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/80">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">All required skills met!</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Improvement / Coaching Tips */}
            {selectedCandidateModal.feedback && selectedCandidateModal.feedback.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Feedback & Observations
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCandidateModal.feedback.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <span className="w-4 h-4 rounded bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidateModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
