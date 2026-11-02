import React from 'react';
import { AppData } from '../../types';
import { calculateXpForNextLevel } from '../../utils/gameLogic';
import { localDateStr } from '../../utils/date';
import { Flame, CheckCircle, Target, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  data: AppData;
  onNavigate: (tab: string) => void;
  onCompleteQuest: (questId: string) => void;
  onOpenStatus: () => void;
}

export const TodayScreen: React.FC<Props> = ({ data, onNavigate, onCompleteQuest, onOpenStatus }) => {
  const { player, quests, subjects, shadows } = data;
  const reqXp = calculateXpForNextLevel(player.level);
  const xpPercent = Math.min(100, Math.round((player.xp / reqXp) * 100));
  const studyPercent = Math.min(100, Math.round((player.todayStudyMinutes / Math.max(1, player.dailyGoalMinutes)) * 100));
  const pendingQuests = quests.filter((q) => !q.completed);
  const totalShadowPower = shadows.reduce((acc, s) => acc + (s.isDormant ? Math.round(s.power / 2) : s.power), 0);

  let dueRevisionsCount = 0;
  const todayStr = localDateStr();
  subjects.forEach((sub) => {
    sub.chapters.forEach((ch) => {
      if (ch.learned && ch.nextRevisionDate && ch.nextRevisionDate <= todayStr) {
        dueRevisionsCount++;
      }
    });
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Player Header Card */}
      <div
        onClick={onOpenStatus}
        className="pro-card p-6 cursor-pointer hover:border-blue-500/40 transition-all group"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-blue-950/60 border border-blue-500/40 rounded-lg flex items-center justify-center font-bold text-xl text-blue-400">
              {player.rank}
            </div>
            <div>
              <div className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">OPERATOR PROFILE</div>
              <h1 className="text-xl font-bold text-white tracking-wide">{player.name}</h1>
              <p className="text-xs font-medium text-indigo-400 mt-0.5">{player.title} | Level {player.level}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-center">
              <div className="text-[10px] text-slate-400 font-medium">STREAK</div>
              <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {player.streak}d
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-center">
              <div className="text-[10px] text-slate-400 font-medium">CREDITS</div>
              <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {player.gold}
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>EXPERIENCE PROGRESSION</span>
            <span className="text-blue-400 font-semibold">{player.xp} / {reqXp} XP ({xpPercent}%)</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full transition-all duration-500" style={{ width: xpPercent + '%' }}></div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="pro-card p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wider mb-1">DAILY STUDY TARGET</div>
            <div className="text-2xl font-bold text-white">{player.todayStudyMinutes} <span className="text-xs text-slate-400 font-normal">/ {player.dailyGoalMinutes} mins</span></div>
            <div className="w-32 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 mt-2.5">
              <div className="bg-blue-500 h-full" style={{ width: studyPercent + '%' }}></div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('focus')}
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Launch Timer
          </button>
        </div>
        <div className="pro-card p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wider mb-1">PENDING REVISIONS</div>
            <div className="text-2xl font-bold text-indigo-400">{dueRevisionsCount} Modules</div>
            <div className="text-[11px] text-slate-400 mt-1">Shadow Army PW: {totalShadowPower}</div>
          </div>
          <button
            onClick={() => onNavigate('learn')}
            className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Review
          </button>
        </div>
      </div>

      {/* Active Quests */}
      <div className="pro-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" /> Active Quests ({pendingQuests.length} Remaining)
          </h2>
          <button
            onClick={() => onNavigate('quests')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2.5">
          {quests.slice(0, 3).map((quest) => (
            <div
              key={quest.id}
              className={`p-3.5 border transition-all flex items-center justify-between rounded-lg ${
                quest.completed ? 'bg-slate-950/40 border-slate-900 opacity-50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => !quest.completed && onCompleteQuest(quest.id)}
                  disabled={quest.completed}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 cursor-pointer ${
                    quest.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 bg-slate-950 hover:border-blue-500'
                  }`}
                >
                  {quest.completed && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <div>
                  <div className={`text-sm font-medium ${quest.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {quest.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{quest.description}</div>
                </div>
              </div>
              <div className="text-xs font-medium text-amber-400 bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-500/20">
                +{quest.xpReward} XP
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
