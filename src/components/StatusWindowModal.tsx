import React from 'react';
import { X, Shield, Zap, Brain, Eye, Target, Clock, Sparkles, Flame } from 'lucide-react';
import { AppData } from '../types';
import { calculateXpForNextLevel } from '../utils/gameLogic';

interface Props {
  data: AppData;
  onClose: () => void;
}

export const StatusWindowModal: React.FC<Props> = ({ data, onClose }) => {
  const { player } = data;
  const reqXp = calculateXpForNextLevel(player.level);
  const xpPercent = Math.min(100, Math.round((player.xp / reqXp) * 100));

  const attrs = [
    { key: 'knowledge', label: 'KNOWLEDGE', icon: Brain, color: 'text-cyan-400' },
    { key: 'focus', label: 'FOCUS', icon: Eye, color: 'text-purple-400' },
    { key: 'discipline', label: 'DISCIPLINE', icon: Shield, color: 'text-emerald-400' },
    { key: 'memory', label: 'MEMORY', icon: Sparkles, color: 'text-amber-400' },
    { key: 'planning', label: 'PLANNING', icon: Target, color: 'text-blue-400' },
    { key: 'consistency', label: 'CONSISTENCY', icon: Clock, color: 'text-cyan-300' },
    { key: 'creativity', label: 'CREATIVITY', icon: Zap, color: 'text-fuchsia-400' },
    { key: 'vitality', label: 'VITALITY', icon: Flame, color: 'text-rose-400' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg system-card system-corners animate-scaleUp overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 to-transparent">
          <div className="sl-label flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            STATUS WINDOW
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Player Identity */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="sl-label mb-1">HUNTER</div>
              <div className="text-2xl font-black tracking-wide text-white">{player.name}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 rounded-sm">
                  RANK {player.rank}
                </span>
                <span className="text-xs text-slate-400 font-mono">{player.title}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="sl-label mb-1">LEVEL</div>
              <div className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600">
                {player.level}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono mb-1.5">
              <span className="text-slate-400">EXPERIENCE</span>
              <span className="text-cyan-400">{player.xp} / {reqXp}</span>
            </div>
            <div className="sl-progress h-2">
              <div className="sl-progress-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-black/40 border border-cyan-500/15 rounded-sm px-3 py-2.5">
              <div className="sl-label mb-0.5">GOLD</div>
              <div className="text-lg font-bold text-amber-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {player.gold}
              </div>
            </div>
            <div className="bg-black/40 border border-cyan-500/15 rounded-sm px-3 py-2.5">
              <div className="sl-label mb-0.5">STREAK</div>
              <div className="text-lg font-bold text-orange-400 font-mono flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {player.streak} days
              </div>
            </div>
            <div className="bg-black/40 border border-cyan-500/15 rounded-sm px-3 py-2.5">
              <div className="sl-label mb-0.5">PATH</div>
              <div className="text-sm font-bold text-purple-300 font-mono">{player.path || 'None'}</div>
            </div>
            <div className="bg-black/40 border border-cyan-500/15 rounded-sm px-3 py-2.5">
              <div className="sl-label mb-0.5">GROWTH PTS</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{player.growthPoints}</div>
            </div>
          </div>

          {/* Attributes */}
          <div>
            <div className="sl-label mb-2.5">ATTRIBUTES</div>
            <div className="grid grid-cols-2 gap-2">
              {attrs.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-sm px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-[10px] font-mono text-slate-400 tracking-wide">{label}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-white">
                    {player.attributes[key]}
                    <span className="text-[10px] text-slate-500 ml-1">{player.attributeGrades[key]}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cyan-500/15 bg-black/30 text-center">
          <span className="text-[10px] font-mono text-slate-500 tracking-widest">
            SYSTEM • SHADOW STUDY PROTOCOL
          </span>
        </div>
      </div>
    </div>
  );
};