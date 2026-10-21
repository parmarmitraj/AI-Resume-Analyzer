import React, { useState } from 'react';
import { Upload, FileCheck, FileText, Trash2, Plus, X, Layers } from 'lucide-react';

export default function ResumeUploader({ 
  selectedFile, 
  setSelectedFile,
  isMultiple = false,
  selectedFiles = [],
  setSelectedFiles
}) {
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isMultiple) {
        const incomingPdfs = Array.from(e.dataTransfer.files).filter(f => 
          f.name.toLowerCase().endsWith('.pdf')
        );
        if (incomingPdfs.length > 0 && setSelectedFiles) {
          setSelectedFiles(prev => {
            const existingKeys = new Set(prev.map(f => `${f.name}_${f.size}`));
            const uniqueNew = incomingPdfs.filter(f => !existingKeys.has(`${f.name}_${f.size}`));
            return [...prev, ...uniqueNew];
          });
        }
      } else {
        if (setSelectedFile) {
          setSelectedFile(e.dataTransfer.files[0]);
        }
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isMultiple) {
        const incomingPdfs = Array.from(e.target.files).filter(f => 
          f.name.toLowerCase().endsWith('.pdf')
        );
        if (incomingPdfs.length > 0 && setSelectedFiles) {
          setSelectedFiles(prev => {
            const existingKeys = new Set(prev.map(f => `${f.name}_${f.size}`));
            const uniqueNew = incomingPdfs.filter(f => !existingKeys.has(`${f.name}_${f.size}`));
            return [...prev, ...uniqueNew];
          });
        }
        // reset input so the same files can be re-selected if deleted
        e.target.value = '';
      } else {
        if (setSelectedFile) {
          setSelectedFile(e.target.files[0]);
        }
      }
    }
  };

  const handleRemoveSingle = (indexToRemove) => {
    if (setSelectedFiles) {
      setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleClearAll = () => {
    if (setSelectedFiles) {
      setSelectedFiles([]);
    }
  };

  /* ------------------- MULTI-FILE UPLOADER (RECRUITER MODE) ------------------- */
  if (isMultiple) {
    const hasFiles = selectedFiles.length > 0;

    return (
      <div className="clean-panel p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Upload Candidate Resumes (Batch)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supported format: PDF (Max 15MB each, up to 30 resumes)
            </p>
          </div>
          {hasFiles && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>

        {/* Drop zone when no files are selected yet */}
        {!hasFiles ? (
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border border-dashed rounded-lg p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            <input 
              type="file" 
              multiple
              onChange={handleFileChange}
              accept=".pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag & drop multiple resume PDFs here
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  or click to select a batch of files from your device
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Staged files list with an add-more button */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Staged Resumes ({selectedFiles.length})</span>
              <span className="text-[11px] text-indigo-400">Ready for screening</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {selectedFiles.map((file, idx) => (
                <div 
                  key={`${file.name}_${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <FileCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate max-w-[210px] sm:max-w-[260px]">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSingle(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900 transition-colors"
                    title="Remove resume"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add more files dropzone */}
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-2.5 text-center transition-all cursor-pointer relative ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-800/80 hover:border-slate-700 bg-slate-950/30'
              }`}
            >
              <input 
                type="file" 
                multiple
                onChange={handleFileChange}
                accept=".pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add more resumes to batch
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------------- SINGLE-FILE UPLOADER (CANDIDATE MODE) ------------------- */
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
