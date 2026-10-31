import React from 'react';
import { AppData, JobPath, Player, RewardItem } from '../../types';
import { Shield, Sparkles, Award, Zap, Lock, Unlock } from 'lucide-react';

interface Props {
  data: AppData;
  onAllocatePoint: (attr: keyof Player['attributes']) => void;
  onSelectPath: (path: JobPath) => void;
  onUseResilience: () => void;
  onUnlockReward: (rewardId: string) => void;
}

export const CharacterScreen: React.FC<Props> = ({ data, onAllocatePoint, onSelectPath, onUseResilience, onUnlockReward }) => {
  const { player, rewards } = data;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="pro-card p-6">
        <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">HUNTER PROFILE & STATUS SHEET</div>
        <h1 className="text-2xl font-bold text-white mt-1">{player.name}'s Character File</h1>
        <p className="text-xs text-slate-400 mt-0.5">Allocate growth points, select your study path, and manage streak resilience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary, Path & Resilience */}
        <div className="space-y-6">
          <div className="pro-card p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-2xl text-blue-400">
                {player.rank}
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-400">LEVEL {player.level}</div>
                <div className="text-lg font-bold text-white">{player.title}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <label className="text-slate-300 font-semibold block uppercase tracking-wider">STUDY DISCIPLINE / PATH</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Scholar', 'Strategist', 'Endurer'] as const).map((pathOption) => (
                  <button
                    key={pathOption}
                    onClick={() => onSelectPath(pathOption)}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      player.path === pathOption
                        ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {pathOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Resilience / Streak Freeze */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <label className="text-slate-300 font-semibold block uppercase tracking-wider">STREAK RESILIENCE (1x / WEEK)</label>
              <button
                onClick={onUseResilience}
                disabled={player.resilienceUsedThisWeek}
                className={`w-full py-2.5 rounded-lg border font-semibold transition-all ${
                  player.resilienceUsedThisWeek
                    ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                }`}
              >
                {player.resilienceUsedThisWeek ? 'Resilience Used This Week' : 'Freeze Streak (Use Resilience)'}
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Attributes & Reward Chest */}
        <div className="lg:col-span-2 space-y-6">
          <div className="pro-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Core Attributes ({player.growthPoints} Available Points)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(player.attributes).map(([key, val]) => {
                const grade = player.attributeGrades[key as keyof Player['attributes']] || 'F';
                return (
                  <div key={key} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-medium">{key}</div>
                      <div className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                        {val} <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold border border-blue-500/30">{grade}</span>
                      </div>
                    </div>
                    {player.growthPoints > 0 && (
                      <button
                        onClick={() => onAllocatePoint(key as keyof Player['attributes'])}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow"
                      >
                        + Allocate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward Chest */}
          <div className="pro-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Reward Chest (Personal Unlocks)
              </h2>
              <span className="text-xs text-amber-400 font-mono">Credits: {player.gold}</span>
            </div>

            <div className="space-y-3">
              {rewards.map((rw) => (
                <div key={rw.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className={`font-semibold ${rw.unlocked ? 'text-emerald-400' : 'text-white'}`}>{rw.title}</div>
                    <div className="text-slate-400 mt-0.5">Cost: {rw.costGold} Credits</div>
                  </div>
                  {rw.unlocked ? (
                    <span className="px-3 py-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <button
                      onClick={() => onUnlockReward(rw.id)}
                      disabled={player.gold < rw.costGold}
                      className={`px-4 py-1.5 rounded font-semibold transition-all ${
                        player.gold >= rw.costGold ? 'bg-amber-600 hover:bg-amber-500 text-white shadow' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Unlock
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
