import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { calculateXpForNextLevel } from '../utils/gameLogic';
import { Sparkles, Flame, X } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  player: Player;
  soundEnabled: boolean;
  onClose: () => void;
  onAllocatePoint: (attr: keyof Player['attributes']) => void;
}

export const StatusWindowModal: React.FC<Props> = ({ player, soundEnabled, onClose, onAllocatePoint }) => {
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    sound.playArise(soundEnabled);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoClose = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoClose);
    };
  }, [onClose, soundEnabled]);

  const reqXp = calculateXpForNextLevel(player.level);
  const energyPercent = Math.min(100, Math.round((player.todayStudyMinutes / Math.max(1, player.dailyGoalMinutes)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0a1128] border-2 border-cyan-400/80 rounded-xl p-6 shadow-[0_0_40px_rgba(0,229,255,0.35)] text-cyan-100 overflow-hidden animate-scaleUp system-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* System Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 tracking-widest">[ STATUS WINDOW ]</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-cyan-300 animate-pulse">Auto-closing in {timeLeft}s</span>
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white bg-cyan-950/50 hover:bg-cyan-900 p-1.5 rounded-lg border border-cyan-500/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3 text-center">
            <div className="text-xs text-cyan-400 font-mono mb-1">LEVEL</div>
            <div className="text-3xl font-black text-cyan-200 font-mono tracking-wider">{player.level}</div>
            <div className="text-[10px] text-cyan-400 mt-1">XP: {player.xp} / {reqXp}</div>
          </div>
          <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3 text-center">
            <div className="text-xs text-cyan-400 font-mono mb-1">RANK</div>
            <div className={`text-3xl font-black font-mono tracking-wider ${
              player.rank === 'S' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
              player.rank === 'A' ? 'text-orange-400' :
              player.rank === 'B' ? 'text-purple-400' :
              player.rank === 'C' ? 'text-blue-400' :
              player.rank === 'D' ? 'text-emerald-400' : 'text-slate-400'
            }`}>{player.rank}</div>
            <div className="text-[10px] text-cyan-400 mt-1">Path: {player.path}</div>
          </div>
          <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3 text-center flex flex-col justify-center">
            <div className="text-xs text-cyan-400 font-mono mb-1">TITLE</div>
            <div className="text-sm font-bold text-violet-300 truncate">{player.title}</div>
            <div className="text-[10px] text-yellow-400 mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Gold: {player.gold}
            </div>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-3 mb-6 bg-slate-950/40 p-4 rounded-lg border border-cyan-500/20">
          <div>
            <div className="flex justify-between text-xs font-mono text-cyan-300 mb-1">
              <span>TODAY ENERGY (Study: {player.todayStudyMinutes}m / {player.dailyGoalMinutes}m)</span>
              <span>{energyPercent}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-cyan-500/30">
              <div
                className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ width: `${energyPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-mono">
            <div className="flex items-center justify-between bg-cyan-950/40 p-2 rounded border border-cyan-500/20">
              <span className="text-cyan-400">Revisions Done:</span>
              <span className="text-cyan-200 font-bold">{player.todayRevisionsDone} / {player.totalRevisionsDue}</span>
            </div>
            <div className="flex items-center justify-between bg-cyan-950/40 p-2 rounded border border-cyan-500/20">
              <span className="text-cyan-400">Streak:</span>
              <span className="text-orange-400 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {player.streak} Days
              </span>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-cyan-400">ATTRIBUTES ({player.growthPoints} Growth Points Available)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(player.attributes).map(([key, val]) => {
              const grade = player.attributeGrades[key as keyof Player['attributes']] || 'F';
              return (
                <div key={key} className="bg-cyan-950/30 border border-cyan-500/20 p-2 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-cyan-400">{key}</div>
                    <div className="text-sm font-mono font-bold text-cyan-100 flex items-center gap-1.5">
                      {val} <span className="text-xs px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-300 font-bold">{grade}</span>
                    </div>
                  </div>
                  {player.growthPoints > 0 && (
                    <button
                      onClick={() => onAllocatePoint(key as keyof Player['attributes'])}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2 py-1 rounded text-xs transition-colors shadow"
                      title="Allocate +1 Growth Point"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase px-6 py-2.5 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
          >
            Acknowledge [Enter System]
          </button>
        </div>
      </div>
    </div>
  );
};
