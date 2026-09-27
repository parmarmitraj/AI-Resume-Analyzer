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
    <div className="glass-card p-6 rounded-2xl">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" /> Target Job Description
      </h2>
      <p className="text-xs text-slate-400 mb-4">Paste the target JD to calculate match percentage & skill gaps</p>

      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste job title, required skills, responsibilities..."
        rows={5}
        className="w-full bg-slate-900/60 border border-slate-700/70 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
      />

      <button
        onClick={onAnalyze}
        disabled={disabled || isAnalyzing}
        className={`w-full mt-4 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
          disabled || isAnalyzing
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.99]'
        }`}
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Resume...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" /> Run AI Match & Analysis
          </>
        )}
      </button>
    </div>
  );
}
