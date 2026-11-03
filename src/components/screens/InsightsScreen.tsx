import React from 'react';
import { AppData } from '../../types';
import { localDateStr } from '../../utils/date';
import { BarChart2, BookOpen, Award } from 'lucide-react';

interface Props {
  data: AppData;
}

export const InsightsScreen: React.FC<Props> = ({ data }) => {
  const { player, sessions, subjects } = data;
  const totalMins = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = Math.round((totalMins / 60) * 10) / 10;

  let totalRevisions = 0;
  subjects.forEach((sub) => {
    sub.chapters.forEach((ch) => {
      totalRevisions += ch.revisionCount;
    });
  });

  const todayStr = localDateStr();
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = localDateStr(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayMins = sessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    return { dayName, dayMins };
  });

  const maxDayMins = Math.max(60, ...last7Days.map((d) => d.dayMins));

  const dailyGrade = player.todayStudyMinutes >= player.dailyGoalMinutes ? 'S' : player.todayStudyMinutes >= 45 ? 'A' : player.todayStudyMinutes >= 25 ? 'B' : 'C';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="system-card p-6">
        <div className="text-[11px] font-mono text-cyan-400 tracking-widest">[ SYSTEM ANALYTICS ]</div>
        <h1 className="text-2xl font-bold font-mono text-white mt-1">Productivity Insights</h1>
      </div>

      {/* Daily System Evaluation Report */}
      <div className="system-card p-6">
        <div className="text-[11px] font-mono text-cyan-400 tracking-widest mb-1">[ SYSTEM EVALUATION REPORT ]</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-mono text-white">Today's Hunter Evaluation</h2>
            <p className="text-xs font-mono text-cyan-300/80 mt-0.5">
              Study Minutes: {player.todayStudyMinutes}m / Goal: {player.dailyGoalMinutes}m
            </p>
          </div>
          <div className="text-center bg-cyan-950/60 border border-cyan-500/40 px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <div className="text-[10px] font-mono text-cyan-400">DAILY GRADE</div>
            <div className={`text-4xl font-black font-mono tracking-wider ${dailyGrade === 'S' ? 'text-yellow-400' : 'text-cyan-200'}`}>
              {dailyGrade}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="pro-card p-5 text-center">
          <div className="text-xs font-mono text-cyan-400 mb-1">TOTAL STUDY TIME</div>
          <div className="text-2xl font-bold font-mono text-white">{totalHours} Hours</div>
        </div>
        <div className="pro-card p-5 text-center">
          <div className="text-xs font-mono text-cyan-400 mb-1">CURRENT STREAK</div>
          <div className="text-2xl font-bold font-mono text-amber-400">{player.streak} Days</div>
        </div>
        <div className="pro-card p-5 text-center">
          <div className="text-xs font-mono text-cyan-400 mb-1">TOTAL SESSIONS</div>
          <div className="text-2xl font-bold font-mono text-blue-400">{sessions.length}</div>
        </div>
        <div className="pro-card p-5 text-center">
          <div className="text-xs font-mono text-cyan-400 mb-1">TOTAL REVISIONS</div>
          <div className="text-2xl font-bold font-mono text-indigo-400">{totalRevisions}</div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="system-card p-6">
        <h2 className="text-xs font-semibold font-mono text-cyan-400 tracking-wider uppercase mb-6 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" /> Weekly Study Activity (Last 7 Days)
        </h2>
        <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-cyan-500/30">
          {last7Days.map((item, idx) => {
            const heightPercent = Math.min(100, Math.round((item.dayMins / maxDayMins) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-cyan-300 font-mono">{item.dayMins}m</span>
                <div
                  className="w-full max-w-[40px] bg-gradient-to-t from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 rounded-t transition-all duration-500 shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  style={{ height: Math.max(8, heightPercent) + '%' }}
                ></div>
                <span className="text-xs text-slate-300 font-mono">{item.dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="system-card p-6">
        <h2 className="text-xs font-semibold font-mono text-cyan-400 tracking-wider uppercase mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" /> Subject Breakdown
        </h2>
        {subjects.length === 0 ? (
          <p className="text-xs font-mono text-cyan-300/80">No subjects registered yet.</p>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => {
              const learnedCount = sub.chapters.filter((c) => c.learned).length;
              const totalCount = sub.chapters.length;
              const pct = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;
              return (
                <div key={sub.id} className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 text-xs font-mono">
                  <div className="flex justify-between font-bold text-white mb-1">
                    <span>{sub.name}</span>
                    <span className="text-cyan-400">{learnedCount} / {totalCount} Chapters ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-cyan-500/30">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full" style={{ width: pct + '%' }}></div>
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
