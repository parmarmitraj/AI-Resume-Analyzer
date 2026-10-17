import React, { useState } from 'react';
import axios from 'axios';
import ResumeUploader from '../components/ResumeUploader';
import JobDescriptionInput from '../components/JobDescriptionInput';
import AnalysisResults from '../components/AnalysisResults';

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleAnalyze = async () => {
    if (!selectedFile || !jobDescription.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('job_description', jobDescription.trim());
    formData.append('job_role', 'Software Engineer');

    try {
      const response = await axios.post('/api/student/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 25000
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div className="clean-panel rounded-xl p-5 border border-slate-800">
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Ad-Hoc Evaluation
        </span>
        <h1 className="text-xl font-bold text-white mt-1">Standalone Resume Auditor</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Paste any custom job description and upload a resume PDF to run full dual-pronged matching and receive AI coaching recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Input */}
        <div className="lg:col-span-5 space-y-4">
          <ResumeUploader 
            selectedFile={selectedFile} 
            setSelectedFile={setSelectedFile} 
          />
          <JobDescriptionInput 
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            disabled={!selectedFile}
          />
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-7">
          <AnalysisResults results={results} />
        </div>
      </div>
    </div>
  );
}
