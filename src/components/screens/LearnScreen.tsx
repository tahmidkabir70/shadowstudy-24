import React, { useState } from 'react';
import { AppData, Chapter } from '../../types';
import { localDateStr } from '../../utils/date';
import { BookOpen, Plus, Ghost } from 'lucide-react';
import ExamTimeSection from '../ExamTimeSection';

interface Props {
  data: AppData;
  onAddSubject: (name: string) => string;
  onAddChapter: (subjectId: string, title: string) => void;
  onMarkLearned: (subjectId: string, chapterId: string) => void;
  onReviewChapter: (
    subjectId: string,
    chapterId: string,
    rating: 'hard' | 'good' | 'easy'
  ) => void;
  onExtractShadow: (chapter: Chapter, subjectName: string) => void;
  onExamComplete: (chapterId: string) => void;
  onClaimExamReward: (chapterId: string) => void;
}

export const LearnScreen: React.FC<Props> = ({
  data,
  onAddSubject,
  onAddChapter,
  onMarkLearned,
  onReviewChapter,
  onExtractShadow,
  onExamComplete,
  onClaimExamReward,
}) => {
  const [selectedSubId, setSelectedSubId] = useState<string>(
    data.subjects[0]?.id || ''
  );
  const [newChapTitle, setNewChapTitle] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSubModal, setShowSubModal] = useState<boolean>(false);

  const activeSub =
    data.subjects.find((s) => s.id === selectedSubId) || data.subjects[0];

  const handleAddChap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapTitle.trim() || !activeSub) return;

    onAddChapter(activeSub.id, newChapTitle.trim());
    setNewChapTitle('');
    setShowAddModal(false);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newId = onAddSubject(newSubName);
    setSelectedSubId(newId);
    setNewSubName('');
    setShowSubModal(false);
  };

  const openAddChapter = () => {
    if (data.subjects.length === 0) {
      setShowSubModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const todayStr = localDateStr();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest">
            [ KNOWLEDGE REPOSITORY ]
          </div>

          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Subjects & Spaced Revisions
          </h1>

          <p className="text-xs font-mono text-cyan-300 mt-0.5">
            Master chapters and unlock Shadow Army extractions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSubModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-mono text-xs uppercase px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>

          <button
            onClick={openAddChapter}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Chapter
          </button>
        </div>
      </div>

      {/* Empty state */}
      {data.subjects.length === 0 && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-8 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-cyan-400 mx-auto" />

          <div className="text-white font-mono font-bold text-base">
            No subjects yet
          </div>

          <p className="text-xs font-mono text-cyan-300/80">
            Add your first subject (for example Physics or Mathematics) to
            start adding chapters.
          </p>

          <button
            onClick={() => setShowSubModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-5 py-2.5 rounded-xl font-bold cursor-pointer"
          >
            Add First Subject
          </button>
        </div>
      )}

      {/* Subject Tabs */}
      {data.subjects.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-2">
          {data.subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubId(sub.id)}
              className={`px-5 py-3 rounded-xl font-mono text-xs uppercase font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeSub && activeSub.id === sub.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              {sub.name} ({sub.chapters.length})
            </button>
          ))}
        </div>
      )}

      {/* Chapters List */}
      {activeSub && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-sm font-mono text-cyan-400 tracking-wider mb-2">
            CHAPTERS IN {activeSub.name.toUpperCase()}
          </h2>

          {activeSub.chapters.length === 0 && (
            <div className="text-xs font-mono text-slate-400">
              No chapters yet. Tap "Add Chapter" to create the first one.
            </div>
          )}

          <div className="space-y-3">
            {activeSub.chapters.map((ch) => {
              const isDue =
                ch.learned &&
                ch.nextRevisionDate &&
                ch.nextRevisionDate <= todayStr;

              const canExtract =
                ch.learned &&
                ch.revisionCount >= 2 &&
                !ch.extractedToShadow;

              return (
                <div
                  key={ch.id}
                  className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          ch.learned
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
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

                    <div className="text-white font-mono font-bold text-base">
                      {ch.title}
                    </div>

                    <div className="text-xs font-mono text-cyan-400/80 mt-1">
                      Revisions: {ch.revisionCount} | Next Revision:{' '}
                      {ch.nextRevisionDate || 'None'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {!ch.learned ? (
                      <button
                        onClick={() => onMarkLearned(activeSub.id, ch.id)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-4 py-2 rounded-xl font-bold shadow cursor-pointer"
                      >
                        Mark Learned
                      </button>
                    ) : (
                      <>
                        {isDue ? (
                          <div className="flex bg-slate-900 border border-cyan-500/30 rounded-xl overflow-hidden font-mono text-xs">
                            <button
                              onClick={() =>
                                onReviewChapter(activeSub.id, ch.id, 'hard')
                              }
                              className="px-3 py-2 text-yellow-400 hover:bg-yellow-950/50 border-r border-cyan-500/20 cursor-pointer"
                              title="Hard (1d interval)"
                            >
                              Hard
                            </button>

                            <button
                              onClick={() =>
                                onReviewChapter(activeSub.id, ch.id, 'good')
                              }
                              className="px-3 py-2 text-cyan-300 hover:bg-cyan-950/50 border-r border-cyan-500/20 cursor-pointer"
                              title="Good (3d interval)"
                            >
                              Good
                            </button>

                            <button
                              onClick={() =>
                                onReviewChapter(activeSub.id, ch.id, 'easy')
                              }
                              className="px-3 py-2 text-emerald-400 hover:bg-emerald-950/50 cursor-pointer"
                              title="Easy (7d interval)"
                            >
                              Easy
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-slate-500 px-3 py-2">
                            Review unlocks {ch.nextRevisionDate}
                          </div>
                        )}

                        {canExtract && (
                          <button
                            onClick={() =>
                              onExtractShadow(ch, activeSub.name)
                            }
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1.5 animate-pulse cursor-pointer"
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

      {/* EXAM TIME */}
      <ExamTimeSection
        subjects={data.subjects}
        onComplete={onExamComplete}
        onClaim={onClaimExamReward}
      />

      {/* Add Subject Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg font-mono font-bold text-cyan-300 mb-4">
              [ ADD SUBJECT ]
            </h2>

            <form
              onSubmit={handleAddSub}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="text-cyan-400 block mb-1">
                  Subject Name
                </label>

                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Physics"
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow cursor-pointer"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg font-mono font-bold text-cyan-300 mb-1">
              [ ADD CHAPTER ]
            </h2>

            {activeSub && (
              <div className="text-xs font-mono text-cyan-400/80 mb-4">
                Subject: {activeSub.name}
              </div>
            )}

            <form
              onSubmit={handleAddChap}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="text-cyan-400 block mb-1">
                  Chapter Title
                </label>

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
                  className="px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow cursor-pointer"
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