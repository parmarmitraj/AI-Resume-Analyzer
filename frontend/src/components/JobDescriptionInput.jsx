import React from 'react';
import { Sparkles, RefreshCw, Zap } from 'lucide-react';

export default function JobDescriptionInput({ 
  jobDescription, 
  setJobDescription, 
  onAnalyze, 
  isAnalyzing, 
  disabled 
}) {
  return (
    <div className="clean-panel p-5 rounded-xl border border-slate-800">
      <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" /> Target Job Description
      </h2>
      <p className="text-xs text-slate-400 mb-3">Paste the target JD to calculate match percentage & skill gaps</p>

      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste complete job description requirements here..."
        rows={6}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed font-mono"
      />

      <button
        onClick={onAnalyze}
        disabled={disabled || isAnalyzing}
        className={`w-full mt-3 py-2 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
          disabled || isAnalyzing
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
        }`}
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Resume...
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5" /> Run AI Match & Analysis
          </>
        )}
      </button>
    </div>
  );
}
