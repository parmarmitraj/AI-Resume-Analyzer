import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
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
              {/* Public Home Landing Page */}
              <Route path="/" element={<HomePage />} />
              
              {/* Protected Student Job Board & Matching */}
              <Route 
                path="/jobs" 
                element={
                  <ProtectedRoute>
                    <JobBoardPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Recruiter Command Hub */}
              <Route 
                path="/recruiter" 
                element={
                  <ProtectedRoute allowedRole="recruiter">
                    <RecruiterPortal />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Candidate Application Tracker */}
              <Route 
                path="/applications" 
                element={
                  <ProtectedRoute allowedRole="candidate">
                    <MyApplicationsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Standalone Custom Resume Auditor */}
              <Route 
                path="/auditor" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected System Intelligence Analytics */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
