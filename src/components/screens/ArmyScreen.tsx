import React from 'react';
import { AppData, Shadow } from '../../types';
import { Ghost, Sparkles, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  data: AppData;
  onUpdateNickname: (shadowId: string, nickname: string) => void;
}

export const ArmyScreen: React.FC<Props> = ({ data, onUpdateNickname }) => {
  const { shadows } = data;
  const totalPower = shadows.reduce((acc, s) => acc + (s.isDormant ? Math.round(s.power / 2) : s.power), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-black border-2 border-purple-500/50 rounded-2xl p-6 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-purple-400 tracking-widest">[ SHADOW MONARCH DOMAIN ]</div>
            <h1 className="text-2xl font-bold font-mono text-white mt-1">Shadow Army Legions</h1>
            <p className="text-xs font-mono text-purple-300 mt-0.5">Loyal soldiers extracted from mastered academic chapters.</p>
          </div>
          <div className="bg-slate-950/80 border border-purple-500/40 rounded-xl px-6 py-3 text-center">
            <div className="text-[10px] font-mono text-purple-400">TOTAL ARMY POWER</div>
            <div className="text-2xl font-bold font-mono text-cyan-300 flex items-center justify-center gap-1">
              <Sparkles className="w-5 h-5 text-purple-400" /> {totalPower} PW
            </div>
          </div>
        </div>
      </div>

      {/* Shadows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shadows.map((shadow) => (
          <div
            key={shadow.id}
            className={`bg-slate-900/90 border-2 rounded-2xl p-6 shadow-lg transition-all ${
              shadow.isDormant ? 'border-yellow-500/40 opacity-75' : 'border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/40 uppercase">
                {shadow.grade}
              </span>
              <span className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {shadow.isDormant ? Math.round(shadow.power / 2) : shadow.power} PW
              </span>
            </div>

            <div className="mb-4">
              <div className="text-xs font-mono text-purple-400 mb-1">{shadow.subjectName}</div>
              <h3 className="text-lg font-bold font-mono text-white mb-2">{shadow.name}</h3>
              {shadow.isDormant && (
                <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-mono bg-yellow-950/40 p-2 rounded-lg border border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4" /> Dormant (Needs Revision)
                </div>
              )}
            </div>

            <div className="space-y-2 font-mono text-xs">
              <label className="text-purple-400 block">Shadow Nickname</label>
              <input
                type="text"
                defaultValue={shadow.customNickname || shadow.name}
                onBlur={(e) => onUpdateNickname(shadow.id, e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
