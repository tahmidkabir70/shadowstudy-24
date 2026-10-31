import React from 'react';
import { AppData } from '../../types';
import { Shield, Sparkles } from 'lucide-react';

interface Props {
  data: AppData;
}

export const SeasonScreen: React.FC<Props> = ({ data }) => {
  const { season } = data;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <div className="text-xs font-mono text-cyan-400 tracking-widest">[ 12-WEEK SEASON MODE ]</div>
        <h1 className="text-2xl font-bold font-mono text-white mt-1">{season.seasonName}</h1>
        <p className="text-xs font-mono text-cyan-300 mt-0.5">Current Progress: Week {season.currentWeek} of 12</p>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <h2 className="text-sm font-mono text-cyan-400 mb-4">SEASON EPISODES & TIMELINE</h2>
        <div className="space-y-3">
          {[...Array(12)].map((_, i) => {
            const weekNum = i + 1;
            const isCurrent = weekNum === season.currentWeek;
            const isPassed = weekNum < season.currentWeek;

            return (
              <div
                key={weekNum}
                className={`p-4 rounded-xl border font-mono flex items-center justify-between ${
                  isCurrent ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' : isPassed ? 'bg-slate-950/60 border-cyan-500/20 text-slate-400' : 'bg-slate-950/30 border-slate-800 text-slate-600'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider">Episode {weekNum}</span>
                  <div className="text-sm font-bold mt-0.5">{weekNum === 12 ? 'Final Weekly Boss Challenge' : `Study Sprint Week ${weekNum}`}</div>
                </div>
                <div>
                  {isCurrent && <span className="text-xs px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold">ACTIVE</span>}
                  {isPassed && <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-400">Completed</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
