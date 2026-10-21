import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { 
  Briefcase, 
  Users, 
  FileText, 
  Sparkles, 
  LogIn, 
  LogOut, 
  UserCheck, 
  Layers
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Strictly tailor navigation options according to role
  let navItems = [];
  if (user?.role === 'candidate') {
    // Candidate / Job Seeker options only
    navItems = [
      { name: 'Jobs & Matching', path: '/jobs', icon: Briefcase },
      { name: 'My Applications', path: '/applications', icon: Layers },
      { name: 'Resume Auditor', path: '/auditor', icon: FileText },
    ];
  } else if (user?.role === 'recruiter') {
    // Recruiter / Hiring Manager options only
    navItems = [
      { name: 'Recruiter Hub', path: '/recruiter', icon: Users },
      { name: 'Active Openings', path: '/jobs', icon: Briefcase },
      { name: 'Resume Auditor', path: '/auditor', icon: FileText },
    ];
  }

  // Show nav tabs strictly when authenticated user is logged in
  const showNavTabs = Boolean(user);

  // Dynamic brand logo target based on role
  const brandDestination = user?.role === 'recruiter' 
    ? '/recruiter' 
    : user?.role === 'candidate' 
    ? '/jobs' 
    : '/';

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo - Routes according to role */}
          <NavLink to={brandDestination} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                AI Resume Matcher
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                v2.0
              </span>
            </div>
          </NavLink>

          {/* Navigation Tabs - Visible after login or on inner pages */}
          {showNavTabs && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          )}

          {/* Auth Controls */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-white truncate max-w-[120px]">{user.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                  user.role === 'recruiter' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-slate-500 hover:text-rose-400 ml-1 p-0.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
