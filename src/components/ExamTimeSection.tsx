import React from 'react';
import { CheckCircle2, Lock, Sparkles, Trophy } from 'lucide-react';
import type { Chapter, Subject } from '../types';

interface ExamTimeSectionProps {
  subjects: Subject[];
  onComplete: (chapterId: string) => void;
  onClaim: (chapterId: string) => void;
}

const ExamTimeSection: React.FC < ExamTimeSectionProps > = ({
  subjects,
  onComplete,
  onClaim,
}) => {
  const totalChapters = subjects.reduce(
    (total, subject) => total + subject.chapters.length,
    0
  );
  
  const completedChapters = subjects.reduce(
    (total, subject) =>
    total +
    subject.chapters.filter((chapter) => chapter.examCompleted).length,
    0
  );
  
  const claimedRewards = subjects.reduce(
    (total, subject) =>
    total +
    subject.chapters.filter((chapter) => chapter.examAriseClaimed).length,
    0
  );
  
  const renderChapter = (chapter: Chapter) => {
    const completed = Boolean(chapter.examCompleted);
    const claimed = Boolean(chapter.examAriseClaimed);
    
    return (
      <div
        key={chapter.id}
        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-white">
              {chapter.title}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {claimed
                ? 'Exam reward already claimed'
                : completed
                  ? 'Chapter completed'
                  : 'Chapter not completed yet'}
            </p>
          </div>

          {claimed ? (
            <CheckCircle2
              size={20}
              className="shrink-0 text-green-400"
            />
          ) : completed ? (
            <Trophy
              size={20}
              className="shrink-0 text-yellow-400"
            />
          ) : (
            <Lock
              size={19}
              className="shrink-0 text-gray-500"
            />
          )}
        </div>

        {!completed && (
          <button
            type="button"
            onClick={() => onComplete(chapter.id)}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              Chapter Complete
            </span>
          </button>
        )}

        {completed && !claimed && (
          <button
            type="button"
            onClick={() => onClaim(chapter.id)}
            className="w-full rounded-lg border border-purple-400/30 bg-purple-500/15 px-3 py-2.5 text-sm font-bold text-purple-300 transition hover:bg-purple-500/25 active:scale-[0.98]"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Sparkles size={16} />
              ARISE — Claim Reward
            </span>
          </button>
        )}

        {claimed && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-center text-xs font-medium text-green-400">
            Reward claimed successfully
          </div>
        )}
      </div>
    );
  };
  
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-indigo-950/30 p-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />

          <h2 className="text-base font-bold text-white">
            EXAM TIME
          </h2>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          Complete a chapter to unlock its ARISE reward.
          Each chapter can give you points or a new Army Member.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-black/20 p-2 text-center">
            <p className="text-lg font-bold text-white">
              {totalChapters}
            </p>
            <p className="text-[10px] text-gray-400">
              Total
            </p>
          </div>

          <div className="rounded-xl bg-black/20 p-2 text-center">
            <p className="text-lg font-bold text-green-400">
              {completedChapters}
            </p>
            <p className="text-[10px] text-gray-400">
              Completed
            </p>
          </div>

          <div className="rounded-xl bg-black/20 p-2 text-center">
            <p className="text-lg font-bold text-purple-300">
              {claimedRewards}
            </p>
            <p className="text-[10px] text-gray-400">
              Rewards
            </p>
          </div>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <p className="text-sm text-gray-400">
            Add a subject and chapters to start Exam Time.
          </p>
        </div>
      ) : (
        subjects.map((subject) => (
          <div
            key={subject.id}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: subject.color }}
              />

              <h3 className="text-sm font-bold text-white">
                {subject.name}
              </h3>

              <span className="text-xs text-gray-500">
                ({subject.chapters.length})
              </span>
            </div>

            {subject.chapters.length === 0 ? (
              <p className="rounded-lg bg-white/[0.03] p-3 text-xs text-gray-500">
                No chapters added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {subject.chapters.map(renderChapter)}
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
};

export default ExamTimeSection;