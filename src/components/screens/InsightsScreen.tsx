import React from 'react';
import { AppData } from '../../types';
import { BarChart2, Clock, Award, Flame, BookOpen } from 'lucide-react';

interface Props {
  data: AppData;
}

export const InsightsScreen: React.FC<Props> = ({ data }) => {
  const { player, sessions, subjects } = data;
  const totalMins = sessions.reduce((acc, s) => acc + s.durationMinutes, 0) + player.todayStudyMinutes;
  const totalHours = Math.round((totalMins / 60) * 10) / 10;

  // Total revisions count across subjects
  let totalRevisions = 0;
  subjects.forEach((sub) => {
    sub.chapters.forEach((ch) => {
      totalRevisions += ch.revisionCount;
    });
  });

  // Last 7 days study minutes
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayMins = sessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0) + (dateStr === new Date().toISOString().split('T')[0] ? player.todayStudyMinutes : 0);
    return { dayName, dayMins };
  });

  const maxDayMins = Math.max(60, ...last7Days.map((d) => d.dayMins));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="pro-card p-6">
        <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">SYSTEM ANALYTICS</div>
        <h1 className="text-2xl font-bold text-white mt-1">Productivity Insights</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="pro-card p-5 text-center">
          <div className="text-xs text-slate-400 font-medium mb-1">TOTAL STUDY TIME</div>
          <div className="text-2xl font-bold text-white">{totalHours} Hours</div>
        </div>
        <div className="pro-card p-5 text-center">
          <div className="text-xs text-slate-400 font-medium mb-1">CURRENT STREAK</div>
          <div className="text-2xl font-bold text-amber-400">{player.streak} Days</div>
        </div>
        <div className="pro-card p-5 text-center">
          <div className="text-xs text-slate-400 font-medium mb-1">TOTAL SESSIONS</div>
          <div className="text-2xl font-bold text-blue-400">{sessions.length}</div>
        </div>
        <div className="pro-card p-5 text-center">
          <div className="text-xs text-slate-400 font-medium mb-1">TOTAL REVISIONS</div>
          <div className="text-2xl font-bold text-indigo-400">{totalRevisions}</div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="pro-card p-6">
        <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase mb-6 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" /> Weekly Study Activity (Last 7 Days)
        </h2>

        <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-800">
          {last7Days.map((item, idx) => {
            const heightPercent = Math.min(100, Math.round((item.dayMins / maxDayMins) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-slate-400 font-mono">{item.dayMins}m</span>
                <div 
                  className="w-full max-w-[40px] bg-blue-600 hover:bg-blue-500 rounded-t transition-all duration-500 shadow"
                  style={{ height: `${Math.max(8, heightPercent)}%` }}
                ></div>
                <span className="text-xs text-slate-300 font-medium">{item.dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="pro-card p-6">
        <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Subject Breakdown
        </h2>
        {subjects.length === 0 ? (
          <p className="text-xs text-slate-400">No subjects registered yet.</p>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => {
              const learnedCount = sub.chapters.filter((c) => c.learned).length;
              const totalCount = sub.chapters.length;
              const pct = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;
              return (
                <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs">
                  <div className="flex justify-between font-semibold text-white mb-1">
                    <span>{sub.name}</span>
                    <span className="text-blue-400">{learnedCount} / {totalCount} Chapters ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-indigo-500 h-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
