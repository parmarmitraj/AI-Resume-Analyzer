import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Building2, Briefcase, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate', // 'candidate' or 'recruiter'
    company: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="clean-panel max-w-sm w-full rounded-xl p-6 border border-slate-700 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Portal Access
            </div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              mode === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Role Selector Pill */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">I am a</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'candidate' })}
                    className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'candidate'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Job Seeker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'recruiter' })}
                    className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'recruiter'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Recruiter</span>
                  </button>
                </div>
              </div>

              {formData.role === 'recruiter' && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Company / Organization</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Acme Corp, Stripe, or Startup Inc."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
