import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, TrendingUp, Cpu, Award, Briefcase, Users } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    avgMatchScore: 0,
    topSkills: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics');
        if (res.data && res.data.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch analytics:', err.message);
        setStats({
          totalJobs: 0,
          totalApplicants: 0,
          avgMatchScore: 0,
          topSkills: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const metricCards = [
    { title: "Active Job Openings", value: stats.totalJobs.toString(), desc: "Positions posted by recruiters", icon: Briefcase, color: "text-indigo-400" },
    { title: "Total Applications", value: stats.totalApplicants.toString(), desc: "Ranked candidate evaluations", icon: Users, color: "text-emerald-400" },
    { title: "Avg Match Score", value: `${stats.avgMatchScore}%`, desc: "System-wide role alignment", icon: TrendingUp, color: "text-purple-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="clean-panel p-5 rounded-xl border border-slate-800">
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Talent Intelligence
        </span>
        <h1 className="text-xl font-bold text-white mt-1">Recruitment Analytics & Skill Demand</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time metrics on candidate matching score distributions and in-demand skills aggregated across all job postings.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className="clean-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-slate-400 font-medium">{m.title}</span>
                <div className="text-2xl font-bold text-white mt-0.5">{m.value}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{m.desc}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Skills Demand Horizontal Bars */}
      <div className="clean-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Most In-Demand Skills</h2>
            <p className="text-xs text-slate-400">Frequency of technical keywords across posted jobs and candidate pools</p>
          </div>
          <span className="text-xs text-indigo-400 font-medium">Aggregated Live</span>
        </div>

        {stats.topSkills.length > 0 ? (
          <div className="space-y-3 pt-1">
            {stats.topSkills.map((skill, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium capitalize">{skill.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{skill.demandPct}% frequency</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${skill.demandPct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No skill statistics available yet. Post jobs and evaluate resumes to populate analytics.
          </div>
        )}
      </div>
    </div>
  );
}
