import React, { useState } from 'react';
import { AppData, AchievementTier } from '../../types';
import { Trophy, CheckCircle, Award, Sparkles, Filter } from 'lucide-react';

interface Props {
  data: AppData;
  onClaimAchievement: (achievementId: string) => void;
}

export const AchievementsScreen: React.FC<Props> = ({ data, onClaimAchievement }) => {
  const { achievements, player, shadows, gates, quests, subjects } = data;
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute total study minutes
  const totalStudyMins = data.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const shadowCount = shadows.length;
  const gateCount = gates.filter((g) => g.cleared).length;
  const completedQuestCount = Math.max(player.questsCompletedTotal || 0, quests.filter((q) => q.completed).length);
  let totalRevisions = 0;
  subjects.forEach((sub) => sub.chapters.forEach((ch) => (totalRevisions += ch.revisionCount)));

  const getMetricValue = (category: string) => {
    switch (category) {
      case 'Study Time': return totalStudyMins;
      case 'Discipline': return player.streak;
      case 'Level': return player.level;
      case 'Army': return shadowCount;
      case 'Gates': return gateCount;
      case 'Knowledge': return totalRevisions;
      case 'Quests': return completedQuestCount;
      default: return 0;
    }
  };

  const tiers: AchievementTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Monarch'];
  const categories = ['All', 'Study Time', 'Discipline', 'Level', 'Army', 'Gates', 'Knowledge', 'Quests'];

  const filteredAchievements = achievements.filter((ach) => {
    const currentVal = getMetricValue(ach.category);
    const isUnlocked = currentVal >= ach.targetValue;
    if (selectedTier !== 'All' && ach.tier !== selectedTier) return false;
    if (selectedCategory !== 'All' && ach.category !== selectedCategory) return false;
    return true;
  });

  const totalUnlocked = achievements.filter((ach) => getMetricValue(ach.category) >= ach.targetValue).length;
  const totalClaimed = achievements.filter((ach) => ach.claimed).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="system-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-cyan-400 tracking-widest">[ SYSTEM CODEX & ARCHIVE ]</div>
            <h1 className="text-2xl font-bold font-mono text-white mt-1">Completion Log & Achievements</h1>
            <p className="text-xs font-mono text-cyan-300/80 mt-0.5">100+ Master Milestones. Claim rewards upon reaching hard-earned targets.</p>
          </div>
          <div className="bg-cyan-950/60 border border-cyan-500/40 rounded-xl px-6 py-3 text-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            <div className="text-[10px] font-mono text-cyan-400">UNLOCKED / TOTAL</div>
            <div className="text-2xl font-bold font-mono text-white">
              {totalUnlocked} <span className="text-cyan-400">/ {achievements.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="system-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-cyan-400 flex items-center gap-1 font-bold">
            <Filter className="w-3.5 h-3.5" /> Tier:
          </span>
          {['All', ...tiers].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-lg border uppercase transition-all cursor-pointer ${
                selectedTier === tier ? 'bg-cyan-600 border-cyan-400 text-white font-bold' : 'bg-slate-950 border-cyan-500/20 text-cyan-400/70 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-cyan-400 flex items-center gap-1 font-bold">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                selectedCategory === cat ? 'bg-blue-600 border-blue-400 text-white font-bold' : 'bg-slate-950 border-cyan-500/20 text-cyan-400/70 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const currentVal = getMetricValue(ach.category);
          const isUnlocked = currentVal >= ach.targetValue;
          const progressPct = Math.min(100, Math.round((currentVal / ach.targetValue) * 100));

          const tierColor =
            ach.tier === 'Monarch' ? 'text-purple-400 border-purple-500/60 bg-purple-950/40' :
            ach.tier === 'Diamond' ? 'text-cyan-300 border-cyan-400/60 bg-cyan-950/40' :
            ach.tier === 'Platinum' ? 'text-slate-200 border-slate-400/60 bg-slate-900/60' :
            ach.tier === 'Gold' ? 'text-yellow-400 border-yellow-500/60 bg-yellow-950/40' :
            ach.tier === 'Silver' ? 'text-slate-300 border-slate-500/60 bg-slate-900/40' :
            'text-amber-600 border-amber-700/60 bg-amber-950/30';

          return (
            <div
              key={ach.id}
              className={`bg-slate-900/90 border-2 rounded-2xl p-5 shadow-lg flex flex-col justify-between font-mono transition-all ${
                ach.claimed ? 'border-emerald-500/50 opacity-80' : isUnlocked ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded border uppercase font-bold ${tierColor}`}>
                    {ach.tier} • {ach.category}
                  </span>
                  <span className="text-xs text-yellow-400 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> +{ach.rewardGold}G
                    {ach.rewardGrowthPoints ? ` / +${ach.rewardGrowthPoints} GP` : ''}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{ach.title}</h3>
                <p className="text-xs text-slate-400 mb-4">{ach.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Progress:</span>
                  <span>{Math.min(currentVal, ach.targetValue)} / {ach.targetValue}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full transition-all duration-500 ${isUnlocked ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.8)]' : 'bg-blue-600'}`} style={{ width: progressPct + '%' }}></div>
                </div>

                {ach.claimed ? (
                  <div className="w-full py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Claimed
                  </div>
                ) : isUnlocked ? (
                  <button
                    onClick={() => onClaimAchievement(ach.id)}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase shadow-[0_0_15px_rgba(0,229,255,0.5)] cursor-pointer animate-pulse"
                  >
                    Claim Reward
                  </button>
                ) : (
                  <div className="w-full py-2 bg-slate-950 border border-slate-800 text-slate-500 rounded-xl text-center text-xs">
                    Locked ({progressPct}%)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
