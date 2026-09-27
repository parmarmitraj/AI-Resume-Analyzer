import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Cpu, Award, FileQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    totalAnalyzed: 0,
    avgMatchScore: 0,
    totalSkillsExtracted: 0,
    topSkills: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load evaluated resumes from history (stored during Dashboard analysis)
    const storedHistory = localStorage.getItem('resume_analysis_history');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        if (Array.isArray(history) && history.length > 0) {
          const totalAnalyzed = history.length;
          const totalScore = history.reduce((acc, item) => acc + (item.matchScore || 0), 0);
          const avgMatchScore = (totalScore / totalAnalyzed).toFixed(1);

          // Aggregate skills frequency
          const skillCounts = {};
          let allExtractedSkillsCount = 0;

          history.forEach(item => {
            const skills = item.extractedSkills || [];
            allExtractedSkillsCount += skills.length;
            skills.forEach(skill => {
              const cleaned = skill.trim();
              skillCounts[cleaned] = (skillCounts[cleaned] || 0) + 1;
            });
          });

          const sortedSkills = Object.entries(skillCounts)
            .map(([name, count]) => ({
              name,
              count,
              demand: `${Math.round((count / totalAnalyzed) * 100)}%`
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

          setAnalyticsData({
            totalAnalyzed,
            avgMatchScore,
            totalSkillsExtracted: allExtractedSkillsCount,
            topSkills: sortedSkills
          });
        }
      } catch (err) {
        console.error("Failed to parse analysis history:", err);
      }
    }
    setLoading(false);
  }, []);

  const metricCards = [
    { title: "Total Resumes Analyzed", value: analyticsData.totalAnalyzed.toString(), desc: "Processed evaluations", icon: Cpu, color: "text-indigo-400" },
    { title: "Avg Match Score", value: `${analyticsData.avgMatchScore}%`, desc: "System-wide alignment", icon: TrendingUp, color: "text-emerald-400" },
    { title: "Skills Extracted", value: analyticsData.totalSkillsExtracted.toString(), desc: "Across analyzed resumes", icon: Award, color: "text-purple-400" },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" /> Analytics & Skill Insights
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics on parsing efficiency, skill frequencies, and candidate alignment score distributions.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-slate-400 font-medium">{m.title}</span>
                <div className="text-2xl font-bold text-white mt-1">{m.value}</div>
                <span className="text-[10px] text-indigo-400 font-medium mt-0.5 block">{m.desc}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${m.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Skill Demand Breakdown */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-white mb-4">Top Extracted In-Demand Skills</h3>
        {analyticsData.topSkills.length > 0 ? (
          <div className="space-y-4">
            {analyticsData.topSkills.map((skill, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{skill.name}</span>
                  <span className="text-slate-400 font-mono">{skill.count} candidate(s) ({skill.demand})</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full"
                    style={{ width: skill.demand }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 flex items-center justify-center">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No Analytics Data Available Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Run resume evaluations on the Dashboard to populate skill frequencies and score analytics.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
