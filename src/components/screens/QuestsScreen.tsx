import React, { useState } from 'react';
import { AppData, Quest, QuestDifficulty, QuestType } from '../../types';
import { CheckCircle, Plus, Trash2, Filter, Award, Sparkles } from 'lucide-react';

interface Props {
  data: AppData;
  onCompleteQuest: (questId: string) => void;
  onAddQuest: (quest: Quest) => void;
  onDeleteQuest: (questId: string) => void;
}

export const QuestsScreen: React.FC<Props> = ({ data, onCompleteQuest, onAddQuest, onDeleteQuest }) => {
  const [filter, setFilter] = useState<'all' | 'daily' | 'main' | 'side'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<QuestType>('side');
  const [newDiff, setNewDiff] = useState<QuestDifficulty>('medium');

  const filteredQuests = data.quests.filter((q) => {
    if (filter === 'all') return true;
    return q.type === filter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const xpReward = newDiff === 'easy' ? 10 : newDiff === 'medium' ? 25 : 50;
    const goldReward = newDiff === 'easy' ? 5 : newDiff === 'medium' ? 12 : 25;

    const newQuest: Quest = {
      id: `custom_${Date.now()}`,
      title: newTitle,
      description: newDesc || 'Custom player quest',
      type: newType,
      difficulty: newDiff,
      xpReward,
      goldReward,
      completed: false,
    };

    onAddQuest(newQuest);
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest">[ SYSTEM QUEST LOG ]</div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">Quests & Missions</h1>
          <p className="text-xs font-mono text-cyan-300 mt-0.5">Complete quests to gain XP, Gold, and level up.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-cyan-500/30 font-mono text-xs">
            {(['all', 'daily', 'main', 'side'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                  filter === f ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-cyan-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Quest
          </button>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filteredQuests.map((quest) => (
          <div
            key={quest.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              quest.completed ? 'bg-slate-950/40 border-cyan-500/10 opacity-60' : 'bg-slate-900/90 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            <div className="flex items-start space-x-4">
              <button
                onClick={() => !quest.completed && onCompleteQuest(quest.id)}
                disabled={quest.completed}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all mt-0.5 ${
                  quest.completed ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-cyan-500/50 hover:border-cyan-400 bg-slate-950'
                }`}
              >
                {quest.completed && <CheckCircle className="w-4 h-4" />}
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                    {quest.type}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                    quest.difficulty === 'hard' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                    quest.difficulty === 'medium' ? 'bg-yellow-950 text-yellow-300 border border-yellow-500/40' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {quest.difficulty}
                  </span>
                </div>
                <div className={`font-mono text-base font-bold ${quest.completed ? 'line-through text-cyan-600' : 'text-white'}`}>
                  {quest.title}
                </div>
                <div className="text-xs text-cyan-400/80 font-mono mt-0.5">{quest.description}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/30">+{quest.xpReward} XP</span>
                <span className="text-yellow-400 bg-yellow-950/40 px-2.5 py-1 rounded border border-yellow-500/30">+{quest.goldReward} Gold</span>
              </div>
              <button
                onClick={() => onDeleteQuest(quest.id)}
                className="text-slate-500 hover:text-red-400 p-2 rounded-lg transition-colors"
                title="Delete Quest"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Quest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg font-mono font-bold text-cyan-300 mb-4">[ CREATE NEW QUEST ]</h2>
            <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-cyan-400 block mb-1">Quest Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Organic Chemistry Chapter 4"
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="text-cyan-400 block mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief objectives..."
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-cyan-400 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as QuestType)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="side">Side Quest</option>
                    <option value="main">Main Quest</option>
                    <option value="daily">Daily Quest</option>
                  </select>
                </div>
                <div>
                  <label className="text-cyan-400 block mb-1">Difficulty</label>
                  <select
                    value={newDiff}
                    onChange={(e) => setNewDiff(e.target.value as QuestDifficulty)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="easy">Easy (+10 XP)</option>
                    <option value="medium">Medium (+25 XP)</option>
                    <option value="hard">Hard (+50 XP)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow"
                >
                  Accept Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
