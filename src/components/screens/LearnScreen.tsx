import React, { useState } from 'react';
import { AppData, Chapter, Subject } from '../../types';
import { BookOpen, CheckCircle, Clock, Plus, RefreshCw, Ghost, Sparkles } from 'lucide-react';

interface Props {
  data: AppData;
  onAddChapter: (subjectId: string, title: string) => void;
  onMarkLearned: (subjectId: string, chapterId: string) => void;
  onReviewChapter: (subjectId: string, chapterId: string, rating: 'hard' | 'good' | 'easy') => void;
  onExtractShadow: (chapter: Chapter, subjectName: string) => void;
}

export const LearnScreen: React.FC<Props> = ({ data, onAddChapter, onMarkLearned, onReviewChapter, onExtractShadow }) => {
  const [selectedSubId, setSelectedSubId] = useState<string>(data.subjects[0]?.id || '');
  const [newChapTitle, setNewChapTitle] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const activeSub = data.subjects.find((s) => s.id === selectedSubId) || data.subjects[0];

  const handleAddChap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapTitle.trim() || !activeSub) return;
    onAddChapter(activeSub.id, newChapTitle);
    setNewChapTitle('');
    setShowAddModal(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest">[ KNOWLEDGE REPOSITORY ]</div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">Subjects & Spaced Revisions</h1>
          <p className="text-xs font-mono text-cyan-300 mt-0.5">Master chapters and unlock Shadow Army extractions.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Chapter
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {data.subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubId(sub.id)}
            className={`px-5 py-3 rounded-xl font-mono text-xs uppercase font-bold whitespace-nowrap transition-all ${
              selectedSubId === sub.id
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400'
            }`}
          >
            {sub.name} ({sub.chapters.length})
          </button>
        ))}
      </div>

      {/* Chapters List */}
      {activeSub && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-sm font-mono text-cyan-400 tracking-wider mb-2">CHAPTERS IN {activeSub.name.toUpperCase()}</h2>

          <div className="space-y-3">
            {activeSub.chapters.map((ch) => {
              const isDue = ch.learned && ch.nextRevisionDate && ch.nextRevisionDate <= todayStr;
              const canExtract = ch.learned && ch.revisionCount >= 2 && !ch.extractedToShadow;

              return (
                <div
                  key={ch.id}
                  className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        ch.learned ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {ch.learned ? 'Learned' : 'Not Learned'}
                      </span>
                      {isDue && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 animate-pulse">
                          Revision Due
                        </span>
                      )}
                      {ch.extractedToShadow && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/40">
                          Extracted to Shadow
                        </span>
                      )}
                    </div>
                    <div className="text-white font-mono font-bold text-base">{ch.title}</div>
                    <div className="text-xs font-mono text-cyan-400/80 mt-1">
                      Revisions: {ch.revisionCount} | Next Revision: {ch.nextRevisionDate || 'None'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {!ch.learned ? (
                      <button
                        onClick={() => onMarkLearned(activeSub.id, ch.id)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-4 py-2 rounded-xl font-bold shadow"
                      >
                        Mark Learned
                      </button>
                    ) : (
                      <>
                        <div className="flex bg-slate-900 border border-cyan-500/30 rounded-xl overflow-hidden font-mono text-xs">
                          <button
                            onClick={() => onReviewChapter(activeSub.id, ch.id, 'hard')}
                            className="px-3 py-2 text-yellow-400 hover:bg-yellow-950/50 border-r border-cyan-500/20"
                            title="Hard (1d interval)"
                          >
                            Hard
                          </button>
                          <button
                            onClick={() => onReviewChapter(activeSub.id, ch.id, 'good')}
                            className="px-3 py-2 text-cyan-300 hover:bg-cyan-950/50 border-r border-cyan-500/20"
                            title="Good (3d interval)"
                          >
                            Good
                          </button>
                          <button
                            onClick={() => onReviewChapter(activeSub.id, ch.id, 'easy')}
                            className="px-3 py-2 text-emerald-400 hover:bg-emerald-950/50"
                            title="Easy (7d interval)"
                          >
                            Easy
                          </button>
                        </div>

                        {canExtract && (
                          <button
                            onClick={() => onExtractShadow(ch, activeSub.name)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1.5 animate-pulse"
                          >
                            <Ghost className="w-4 h-4" /> ARISE
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg font-mono font-bold text-cyan-300 mb-4">[ ADD CHAPTER ]</h2>
            <form onSubmit={handleAddChap} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-cyan-400 block mb-1">Chapter Title</label>
                <input
                  type="text"
                  value={newChapTitle}
                  onChange={(e) => setNewChapTitle(e.target.value)}
                  placeholder="e.g. Quantum Entanglement"
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  required
                />
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
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
