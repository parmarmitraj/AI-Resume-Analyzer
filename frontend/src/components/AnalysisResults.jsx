import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Award, BarChart3 } from 'lucide-react';

export default function AnalysisResults({ results }) {
  if (!results) {
    return (
      <div className="h-full min-h-[400px] glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-lg font-semibold text-white">No Analysis Results Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload a candidate resume and click <span className="text-indigo-400">Run AI Match</span> to view real-time score analytics and feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Score & Candidate Overview */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Analysis Complete</span>
            <h2 className="text-2xl font-bold text-white mt-1">{results.candidateName}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{results.summary}</p>
          </div>

          {/* Circular Match Gauge */}
          <div className="flex items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-400 stroke-current"
                  strokeDasharray={`${results.matchScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-bold text-white">{results.matchScore}%</span>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-300">Match Score</div>
              <div className="text-[10px] text-emerald-400 font-medium">Strong Alignment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Matched Skills */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" /> Matched Skills ({results.extractedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.extractedSkills.map((skill, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4" /> Missing / Target Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.missingSkills.map((skill, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2 mb-4">
          <Award className="w-4 h-4" /> Actionable Recommendations
        </h3>
        <div className="space-y-3">
          {results.feedback.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold">
                {index + 1}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
