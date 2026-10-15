import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import JobBoardPage from './pages/JobBoardPage';
import RecruiterPortal from './pages/RecruiterPortal';
import MyApplicationsPage from './pages/MyApplicationsPage';
import Dashboard from './pages/Dashboard';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
          {/* Navigation */}
          <Navbar />

          {/* Page Content */}
          <main className="flex-1">
            <Routes>
              {/* Default Home Landing Page */}
              <Route path="/" element={<HomePage />} />
              
              {/* Student Job Board & Matching */}
              <Route path="/jobs" element={<JobBoardPage />} />
              
              {/* Recruiter Job Posting & Leaderboard */}
              <Route path="/recruiter" element={<RecruiterPortal />} />
              
              {/* Candidate Application Tracker */}
              <Route path="/applications" element={<MyApplicationsPage />} />
              
              {/* Standalone Custom Resume Auditor */}
              <Route path="/auditor" element={<Dashboard />} />
              
              {/* System Intelligence Analytics */}
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
