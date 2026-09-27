import React, { useState } from 'react';
import { Upload, FileCheck, FileText } from 'lucide-react';

export default function ResumeUploader({ selectedFile, setSelectedFile }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Upload className="w-5 h-5 text-indigo-400" /> Upload Resume
      </h2>
      <p className="text-xs text-slate-400 mb-4">Supported formats: PDF, DOCX (Max 10MB)</p>

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : selectedFile 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-slate-700/80 hover:border-slate-500 bg-slate-900/40'
        }`}
      >
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc"
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-300 truncate max-w-[240px] mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Change File
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                Drag & drop your resume here
              </p>
              <p className="text-xs text-slate-500 mt-1">or browse from your device</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
