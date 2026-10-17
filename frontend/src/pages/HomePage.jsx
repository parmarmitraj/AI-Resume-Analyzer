import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  UploadCloud, 
  Award,
  Zap,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function HomePage() {
  const steps = [
    {
      num: '01',
      title: 'Upload Resume PDF',
      desc: 'Our parser extracts technical skills and experience in memory with zero data leakage.',
      icon: UploadCloud
    },
    {
      num: '02',
      title: 'Dual-Pronged AI Evaluation',
      desc: 'Matches exact skill ontologies + semantic TF-IDF context vectors with non-linear grading.',
      icon: Cpu
    },
    {
      num: '03',
      title: 'Instant Match & Ranked Apply',
      desc: 'Students see match scores on every job card; recruiters see auto-ranked leaderboards.',
      icon: Award
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Two-Way AI Recruitment Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
          Smart Resume Matching & <br className="hidden sm:inline" />
          <span className="text-indigo-400">Automated Candidate Ranking</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
          A modern recruitment hub connecting candidates and recruiters. Candidates discover real-time match scores on active jobs, while recruiters get incoming applicants automatically sorted from highest match to lowest.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <NavLink
            to="/jobs"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Jobs & Test Match</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>

          <NavLink
            to="/recruiter"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Recruiter Command Hub</span>
          </NavLink>

          <NavLink
            to="/auditor"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Ad-hoc Resume Auditor</span>
          </NavLink>
        </div>
      </section>

      {/* Dual Role Showcase Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Card */}
          <div className="clean-panel rounded-xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                For Students & Candidates
              </span>
              <h2 className="text-xl font-bold text-white">Know Your Job Match Before You Apply</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stop guessing how well your resume fits. Upload your PDF once to instantly calculate personalized compatibility scores across every open position on the portal.
              </p>

              <ul className="space-y-2 pt-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real-time match score pills (80%+ Emerald, 60%+ Indigo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Exact Matched Skills vs. Missing Requirements breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Persistent Resume Profile Locker & 1-click apply</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live status tracking on your applications</span>
                </li>
              </ul>
            </div>

            <NavLink
              to="/jobs"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-4 border-t border-slate-800"
            >
              <span>Browse Active Openings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {/* Recruiter Card */}
          <div className="clean-panel rounded-xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                For Recruiters & Hiring Managers
              </span>
              <h2 className="text-xl font-bold text-white">AI-Ranked Applicant Leaderboards</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Post jobs with automated skill detection. Incoming candidates are automatically sorted by match score from highest to lowest, cutting screening time by 80%.
              </p>

              <ul className="space-y-2 pt-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automated skill requirement extraction from JD text</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ranked leaderboard table (🥇 #1, 🥈 #2, 🥉 #3 medals)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bulk dropzone to screen 30+ resumes simultaneously</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Private recruiter review notes & 1-click CSV export</span>
                </li>
              </ul>
            </div>

            <NavLink
              to="/recruiter"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold pt-4 border-t border-slate-800"
            >
              <span>Manage Job Openings & Leaderboards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="clean-panel rounded-xl p-8 border border-slate-800 space-y-8">
          <div className="text-center max-w-md mx-auto space-y-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Workflow</span>
            <h3 className="text-lg font-bold text-white">How the Platform Works</h3>
            <p className="text-xs text-slate-400">Streamlined dual-sided recruitment powered by native JS NLP.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="bg-slate-950/70 p-5 rounded-lg border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 font-mono">{s.num}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="clean-panel rounded-xl p-8 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white">Ready to test your resume or post an opening?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Get started immediately. No complex onboarding or Python setup required.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <NavLink
              to="/jobs"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Start Matching Resumes
            </NavLink>
            <NavLink
              to="/analytics"
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
            >
              View Skill Analytics
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
}
