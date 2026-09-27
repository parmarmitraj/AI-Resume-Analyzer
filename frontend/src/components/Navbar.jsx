import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, LayoutDashboard, Users, BarChart2, Sparkles } from 'lucide-react';

export default function Navbar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Candidate Database', path: '/resumes', icon: Users },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];

  return (
    <header className="relative z-20 glass-panel border-b border-slate-800/80 sticky top-0 px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <NavLink to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] transition-transform group-hover:scale-105">
          <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            ResuAI <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">v2.0</span>
          </h1>
          <p className="text-xs text-slate-400">AI Resume Analyzer & Matcher</p>
        </div>
      </NavLink>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 glass-card p-1.5 rounded-xl border border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Engine Status */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 glass-card px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          NLP Engine Ready
        </div>
      </div>
    </header>
  );
}
