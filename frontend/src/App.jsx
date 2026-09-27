import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ResumesPage from './pages/ResumesPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        {/* Ambient Glow Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]"></div>
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/15 rounded-full blur-[128px]"></div>
        </div>

        {/* Persistent Navigation Header */}
        <Navbar />

        {/* Page Views with Router */}
        <main className="relative z-10 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
