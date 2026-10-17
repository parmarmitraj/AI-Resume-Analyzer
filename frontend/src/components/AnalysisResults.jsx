import React from 'react';
import { CheckCircle2, AlertCircle, Award, BarChart3, Sparkles } from 'lucide-react';

export default function AnalysisResults({ results }) {
  if (!results) {
    return (
      <div className="h-full min-h-[350px] clean-panel rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 border border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-sm font-semibold text-white">No Analysis Results Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload a resume PDF and click <span className="text-indigo-400">Run AI Match</span> to view real-time score analytics and coaching recommendations.
          </p>
        </div>
      </div>
    );
  }

  const score = results.matchScore || 0;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-indigo-400' : 'text-amber-400';

  return (
    <div className="space-y-4">
      {/* Score Overview Banner */}
      <div className="clean-panel p-5 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
              Evaluation Completed
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">{results.candidateName}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">{results.summary}</p>
          </div>

          {/* Clean Metric Badge */}
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800 shrink-0">
            <div className="text-center">
              <div className={`text-2xl font-extrabold ${scoreColor}`}>{score}%</div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Overall Match</span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="space-y-0.5 text-[11px]">
              <div className="text-slate-300">
                Skills: <span className="font-semibold text-white">{results.skillScore}%</span>
              </div>
              <div className="text-slate-300">
                Context: <span className="font-semibold text-white">{results.contextScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Matched Skills */}
        <div className="clean-panel p-4 rounded-xl border border-slate-800">
          <h3 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({results.extractedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {results.extractedSkills.length > 0 ? (
              results.extractedSkills.map((skill, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/80">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No overlapping skills detected.</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="clean-panel p-4 rounded-xl border border-slate-800">
          <h3 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2.5">
            <AlertCircle className="w-3.5 h-3.5" /> Missing Skills ({results.missingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {results.missingSkills.length > 0 ? (
              results.missingSkills.map((skill, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/80">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">All required skills met!</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Coaching Tips */}
      {results.feedback && results.feedback.length > 0 && (
        <div className="clean-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Actionable Resume Recommendations
          </h3>
          <div className="space-y-2">
            {results.feedback.map((item, index) => (
              <div key={index} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="w-4 h-4 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  {index + 1}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
