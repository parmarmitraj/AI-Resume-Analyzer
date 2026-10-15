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
    <div className="clean-panel p-5 rounded-xl border border-slate-800">
      <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Upload className="w-4 h-4 text-indigo-400" /> Upload Candidate Resume
      </h2>
      <p className="text-xs text-slate-400 mb-3">Supported format: PDF (Max 15MB)</p>

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : selectedFile 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
        }`}
      >
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf"
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {selectedFile ? (
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300 truncate max-w-[200px] mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Select different file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">
                Drag & drop your resume PDF
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">or click to browse from device</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
