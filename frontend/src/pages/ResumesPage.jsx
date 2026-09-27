import React, { useState, useEffect } from 'react';
import { Users, Search, FileQuestion, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResumesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    // Load evaluated resumes from local storage history
    const storedHistory = localStorage.getItem('resume_analysis_history');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        if (Array.isArray(history)) {
          setCandidates(history);
        }
      } catch (err) {
        console.error("Failed to parse candidates history:", err);
      }
    }
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem('resume_analysis_history');
    setCandidates([]);
  };

  const filteredCandidates = candidates.filter(c => 
    (c.candidateName && c.candidateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.fileName && c.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.extractedSkills && c.extractedSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Candidate Database
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse and search analyzed candidate profiles and resume match histories.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate, file, or skill..."
              className="w-full bg-slate-900/60 border border-slate-700/70 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {candidates.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear Saved History"
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Candidate List or Empty State */}
      {filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-sm">
                    {(candidate.candidateName || candidate.fileName || "Candidate")
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                    }
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {candidate.candidateName || candidate.fileName || "Candidate Resume"}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">
                      File: {candidate.fileName || "Uploaded Resume"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400">{candidate.matchScore}%</span>
                  <span className="block text-[10px] text-slate-500">Match Rate</span>
                </div>
              </div>

              {/* Skills */}
              {candidate.extractedSkills && candidate.extractedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.extractedSkills.map((skill, sIdx) => (
                    <span key={sIdx} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Evaluated: {candidate.date || new Date().toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {candidate.matchScore >= 80 ? 'High Match' : candidate.matchScore >= 60 ? 'Moderate Match' : 'Low Alignment'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold text-white">No Candidate Resumes Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No candidates match your search filter or no resumes have been analyzed yet. Go to the Dashboard to evaluate new resumes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
