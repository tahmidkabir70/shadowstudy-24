/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppData, AppSettings, Chapter, ExamChapter, Gate, JobPath, NoteItem, PlannerItem, Player, Quest, Rank, Shadow, ShopItem, Subject } from './types';
import { loadAppData, saveAppData, normalizeData } from './utils/storage';
import { addXpAndGold, getNextRevisionDays, calculateRank, gradeForRevisions, powerForRevisions } from './utils/gameLogic';
import { rollExamReward, getDuplicateReward } from './utils/examRewards';
import { localDateStr, daysBetween, addDays, seasonWeek } from './utils/date';
import { sound } from './utils/sound';
import { t } from './utils/i18n';
import { StatusWindowModal } from './components/StatusWindowModal';
import { AriseModal } from './components/AriseModal';
import { BootOnboarding } from './components/BootOnboarding';
import { TodayScreen } from './components/screens/TodayScreen';
import { QuestsScreen } from './components/screens/QuestsScreen';
import { FocusScreen } from './components/screens/FocusScreen';
import { LearnScreen } from './components/screens/LearnScreen';
import { ArmyScreen } from './components/screens/ArmyScreen';
import { GatesScreen } from './components/screens/GatesScreen';
import { CharacterScreen } from './components/screens/CharacterScreen';
import { PlannerScreen } from './components/screens/PlannerScreen';
import { NotesScreen } from './components/screens/NotesScreen';
import { InsightsScreen } from './components/screens/InsightsScreen';
import { SkillTreeScreen } from './components/screens/SkillTreeScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { SeasonScreen } from './components/screens/SeasonScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AchievementsScreen } from './components/screens/AchievementsScreen';
import { VowScreen } from './components/screens/VowScreen';
import { defaultVow, vowStreakDays, VOW_REWARDS } from './utils/vow';
import {
  Home, Target, Clock, BookOpen, Ghost, Shield, User,
  Calendar, FileText, BarChart2, Zap, ShoppingBag, Award, Trophy, Settings as SettingsIcon, Menu, X, Flame
} from 'lucide-react';

// Streak: +1 once per local day, on the first XP-earning study action.
function applyStudyStreak(data: AppData, today: string): { data: AppData; toastStreak: number } {
  const p = data.player;
  if (p.lastStudyDate === today) return { data, toastStreak: 0 };
  let streak = 1;
  if (p.lastStudyDate) {
    const gap = daysBetween(p.lastStudyDate, today);
    if (gap < 0) return { data, toastStreak: 0 };
    if (gap === 1 || (gap > 1 && p.resilienceUsedThisWeek)) {
      streak = p.streak + 1;
    }
  }
  return {
    data: { ...data, player: { ...p, streak, lastStudyDate: today } },
    toastStreak: streak > p.streak ? streak : 0,
  };
}

// Data safety: old saved subjects may not have "examChapters". Fall back to [].
function ensureExamChapters(d: AppData): AppData {
  return {
    ...d,
    subjects: d.subjects.map((sub) =>
      Array.isArray(sub.examChapters) ? sub : { ...sub, examChapters: [] }
    ),
  };
}

// Permanent nickname: locked explicitly, or (old saves) already has a custom nickname.
function isNicknameLocked(shadow: Shadow): boolean {
  return shadow.customNicknameLocked === true || Boolean(shadow.customNickname && shadow.customNickname.trim());
}

// A nickname is taken if another Army member already displays the same name (case-insensitive).
function isNicknameTaken(shadows: Shadow[], nickname: string, excludeShadowId: string): boolean {
  const key = nickname.trim().toLowerCase();
  return shadows.some(
    (s) => s.id !== excludeShadowId && (s.customNickname || s.name).trim().toLowerCase() === key
  );
}

// ---------------------------------------------------------------------------
// Exam Time lottery
// ---------------------------------------------------------------------------

const EXAM_EXTRACTION_CHANCE = 0.05; // 5% Shadow Extraction
const EXAM_NO_EXTRACTION_XP = 40;
const EXAM_NO_EXTRACTION_GOLD = 20;
const EXAM_LOW_LUCK_COUNT = 4;

// S Rank is never obtainable from Exam Time.
const NORMAL_RANK_WEIGHTS: Array<[Rank, number]> = [
  ['E', 45],
  ['D', 30],
  ['C', 15],
  ['B', 8],
  ['A', 2],
];

// After an A Rank: next 4 successful extractions are E/D only.
const LOW_LUCK_RANK_WEIGHTS: Array<[Rank, number]> = [
  ['E', 70],
  ['D', 30],
];

function rollExamRank(weights: Array<[Rank, number]>): Rank {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [rank, weight] of weights) {
    if (roll < weight) return rank;
    roll -= weight;
  }
  return weights[weights.length - 1][0];
}

type ExamShadowTemplate = {
  name: string;
  rank: Rank;
  grade: Shadow['grade'];
  power: number;
};

const FALLBACK_SHADOW_STATS: Record<string, { grade: Shadow['grade']; power: number }> = {
  E: { grade: 'Soldier', power: 25 },
  D: { grade: 'Soldier', power: 40 },
  C: { grade: 'Elite', power: 60 },
  B: { grade: 'Knight', power: 85 },
  A: { grade: 'Elite Knight', power: 115 },
};

// Picks an Army Pool member of the requested rank using the existing reward pool.
// The rank is decided first (independently per extraction); the pool only supplies the member.
function pickExamShadowTemplate(rank: Rank): ExamShadowTemplate {
  for (let attempt = 0; attempt < 400; attempt++) {
    const candidate = rollExamReward();
    if (candidate.type !== 'points' && candidate.rank === rank) {
      return {
        name: candidate.name,
        rank,
        grade: candidate.grade,
        power: candidate.power,
      };
    }
  }

  // Safety fallback if the pool has no member for this rank.
  const stats = FALLBACK_SHADOW_STATS[rank] || FALLBACK_SHADOW_STATS.E;
  return {
    name: `${rank}-Rank Shadow Soldier #${Math.floor(Math.random() * 900 + 100)}`,
    rank,
    grade: stats.grade,
    power: stats.power,
  };
}

// Marks one exam chapter as claimed (synchronous double-claim guard + refresh safety).
function markExamChapterClaimed(d: AppData, chapterId: string): AppData {
  return {
    ...d,
    subjects: d.subjects.map((sub) => ({
      ...sub,
      examChapters: (sub.examChapters || []).map((ch) =>
        ch.id === chapterId ? { ...ch, examAriseClaimed: true } : ch
      ),
    })),
  };
}

// Undo a claim mark (only used to recover from an impossible half-finished state).
function releaseExamChapterClaim(d: AppData, chapterId: string): AppData {
  return {
    ...d,
    subjects: d.subjects.map((sub) => ({
      ...sub,
      examChapters: (sub.examChapters || []).map((ch) =>
        ch.id === chapterId ? { ...ch, examAriseClaimed: false } : ch
      ),
    })),
  };
}

// Removes an exam chapter. Only subject.examChapters is touched, never subject.chapters.
function removeExamChapter(d: AppData, chapterId: string): AppData {
  return {
    ...d,
    subjects: d.subjects.map((sub) => ({
      ...sub,
      examChapters: (sub.examChapters || []).filter((ch) => ch.id !== chapterId),
    })),
  };
}

// After a pending exam shadow's nickname is locked: remove its exam chapter and clear pending.
function finalizePendingExam(d: AppData, shadowId: string): AppData {
  const pendingId = d.pendingExamChapterId;
  const shadow = d.shadows.find((s) => s.id === shadowId);
  if (!pendingId || !shadow || shadow.chapterId !== pendingId) return d;
  return { ...removeExamChapter(d, pendingId), pendingExamChapterId: undefined };
}

export default function App() {
  const [data, setData] = useState<AppData>(() => ensureExamChapters(loadAppData()));
  const [currentTab, setCurrentTab] = useState<string>('today');
  const [showStatusPopup, setShowStatusPopup] = useState<boolean>(false);
  const [ariseData, setAriseData] = useState<{ shadowId: string; shadowName: string; subjectName: string; grade: string; power: number } | null>(null);
  const [doubleDungeonTitle, setDoubleDungeonTitle] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number; rank: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Remembers which ARISE shadow just had its nickname saved, so the modal can close safely.
  const confirmedAriseShadowIdRef = useRef<string | null>(null);

  // Always holds the latest data so Exam claims can read it synchronously.
  const dataRef = useRef<AppData>(data);
  dataRef.current = data;

  // Synchronous lock against double-click claims.
  const claimLockRef = useRef<boolean>(false);

  const lang = data.settings.language;

  const isWelcomeDone = typeof localStorage !== 'undefined' && localStorage.getItem('SHADOW_STUDY_WELCOME_DONE') === '1';
  const hasValidName = Boolean(data.player.name && data.player.name !== 'Player');

  useEffect(() => {
    if (hasValidName && !isWelcomeDone) {
      try {
        localStorage.setItem('SHADOW_STUDY_WELCOME_DONE', '1');
      } catch {
        // ignore
      }
    }
  }, [hasValidName, isWelcomeDone]);

  const isOnboarding = !hasValidName;

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Writes new data and updates the ref immediately (no random/side effects inside updaters).
  const commitData = (next: AppData) => {
    dataRef.current = next;
    setData(next);
  };

  // Re-opens the ARISE nickname modal for a pending (not yet nicknamed) exam shadow.
  const openPendingArise = (d: AppData): boolean => {
    const pendingId = d.pendingExamChapterId;
    if (!pendingId) return false;
    const shadow = d.shadows.find((s) => s.chapterId === pendingId);
    if (!shadow || isNicknameLocked(shadow)) return false;
    setAriseData({
      shadowId: shadow.id,
      shadowName: shadow.name,
      subjectName: shadow.subjectName,
      grade: shadow.rank ? `${shadow.rank}-RANK` : shadow.grade,
      power: shadow.power,
    });
    return true;
  };

  // Refresh recovery: restore a pending exam ARISE so the extraction is never lost.
  useEffect(() => {
    const d = dataRef.current;
    const pendingId = d.pendingExamChapterId;
    if (!pendingId) return;

    const shadow = d.shadows.find((s) => s.chapterId === pendingId);

    if (!shadow) {
      // No shadow was ever added: safely release the chapter so it can be claimed again.
      setData((prev) => {
        if (prev.pendingExamChapterId !== pendingId) return prev;
        if (prev.shadows.some((s) => s.chapterId === pendingId)) return prev;
        return { ...releaseExamChapterClaim(prev, pendingId), pendingExamChapterId: undefined };
      });
      return;
    }

    if (isNicknameLocked(shadow)) {
      // Nickname was already locked: just finish the chapter removal.
      setData((prev) => finalizePendingExam(prev, shadow.id));
      return;
    }

    openPendingArise(d);
  }, []);

  const runDailyCheck = () => {
    const todayStr = localDateStr();
    setData((prev) => {
      const lastActive = prev.player.lastActiveDate;
      if (!lastActive || lastActive === todayStr) return prev;
      const diffDays = daysBetween(lastActive, todayStr);
      if (diffDays < 0) return prev;

      let streak = prev.player.streak;
      let shop = prev.shop;
      let lastStudyDate = prev.player.lastStudyDate;

      if (diffDays > 1) {
        const shieldItem = prev.shop.find((s) => s.type === 'shield' && s.quantity > 0);
        if (prev.player.resilienceUsedThisWeek) {
          showToast('Streak protected by Resilience!');
        } else if (shieldItem) {
          shop = prev.shop.map((s) => (s.id === shieldItem.id ? { ...s, quantity: s.quantity - 1 } : s));
          lastStudyDate = addDays(todayStr, -1);
          streak = prev.player.streak + 1;
          showToast('Streak Shield used! Your streak is saved and protected.');
        } else {
          streak = 1;
          showToast('Streak reset due to inactivity. A Comeback Quest has been issued.');
        }
      }

      let resilienceUsed = prev.player.resilienceUsedThisWeek;
      let resilienceDate = prev.player.resilienceUsedDate || '';
      if (resilienceUsed) {
        if (!resilienceDate) {
          resilienceDate = lastActive;
        } else if (daysBetween(resilienceDate, todayStr) >= 7) {
          resilienceUsed = false;
        }
      }

      const newQuests = prev.quests
        .filter((q) => !(q.type === 'comeback' && q.completed))
        .map((q) => (q.type === 'daily' && q.completed ? { ...q, completed: false, completedDate: undefined } : q));

      if (diffDays > 1) {
        const hasComeback = newQuests.some((q) => q.type === 'comeback');
        if (!hasComeback) {
          newQuests.unshift({
            id: 'comeback_' + Date.now(),
            title: 'Comeback Awakening',
            description: '10-minute easy study session to resume your ascent.',
            type: 'comeback',
            difficulty: 'easy',
            xpReward: 30,
            goldReward: 15,
            completed: false,
          });
        }
      }

      // Shadows whose chapter revision is 3+ days overdue become dormant; revising wakes them.
      const updatedShadows = prev.shadows.map((sh) => {
        const chapterRef = prev.subjects.flatMap((sub) => sub.chapters).find((ch) => ch.id === sh.chapterId);
        if (!chapterRef || !chapterRef.nextRevisionDate) return sh;
        const dormant = daysBetween(chapterRef.nextRevisionDate, todayStr) >= 3;
        return sh.isDormant === dormant ? sh : { ...sh, isDormant: dormant };
      });
      const seasonStart = prev.season.startDate || todayStr;
      const updatedSeason = { ...prev.season, startDate: seasonStart, currentWeek: seasonWeek(seasonStart, todayStr) };

      return {
        ...prev,
        shadows: updatedShadows,
        season: updatedSeason,
        player: {
          ...prev.player,
          streak,
          lastActiveDate: todayStr,
          lastStudyDate,
          resilienceUsedThisWeek: resilienceUsed,
          resilienceUsedDate: resilienceDate,
          todayStudyMinutes: 0,
          todayRevisionsDone: 0,
        },
        quests: newQuests,
        shop,
      };
    });
  };

  useEffect(() => {
    runDailyCheck();
    const onVisible = () => {
      if (document.visibilityState === 'visible') runDailyCheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const announceStreak = (streakDays: number) => {
    if (streakDays > 0) {
      setTimeout(() => showToast('Streak: ' + streakDays + ' days!'), 1500);
    }
  };

  const handleCompleteOnboarding = (name: string, path: JobPath, goalMinutes: number, goalTitle: string) => {
    try {
      localStorage.setItem('SHADOW_STUDY_WELCOME_DONE', '1');
    } catch {
      // ignore
    }
    setData((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        name,
        path,
        dailyGoalMinutes: goalMinutes,
        title: 'Novice ' + path,
      },
      quests: [
        {
          id: 'main_goal_' + Date.now(),
          title: goalTitle,
          description: 'Main system objective defined upon awakening.',
          type: 'main',
          difficulty: 'hard',
          xpReward: 100,
          goldReward: 50,
          completed: false,
        },
        ...prev.quests,
      ],
    }));
    setShowStatusPopup(true);
    showToast('System Awakening Complete. Welcome, Hunter ' + name + '.');
  };

  const handleCompleteQuest = (questId: string) => {
    setData((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.id === questId) {
          return { ...q, completed: true, completedDate: localDateStr() };
        }
        return q;
      });
      const quest = prev.quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return prev;
      const nextData = { ...prev, quests: updatedQuests };
      const streakResult = applyStudyStreak(nextData, localDateStr());
      announceStreak(streakResult.toastStreak);
      const rewardedToday = prev.quests.filter((q) => q.completed && q.completedDate === localDateStr()).length;
      const questCapped = rewardedToday >= 6;
      if (questCapped) showToast('Daily quest reward cap reached (6 quests).');
      const res = addXpAndGold(streakResult.data, questCapped ? 0 : quest.xpReward, questCapped ? 0 : quest.goldReward, showToast);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return {
        ...res.data,
        player: { ...res.data.player, questsCompletedTotal: (res.data.player.questsCompletedTotal || 0) + 1 },
      };
    });
  };

  const handleAddQuest = (quest: Quest) => {
    setData((prev) => ({ ...prev, quests: [quest, ...prev.quests] }));
    showToast('New quest issued by the system.');
  };

  const handleDeleteQuest = (questId: string) => {
    setData((prev) => ({ ...prev, quests: prev.quests.filter((q) => q.id !== questId) }));
  };

  const handleFinishFocusSession = (minutes: number, subject: string) => {
    setData((prev) => {
      const todayStudyMins = prev.player.todayStudyMinutes + minutes;
      let xpAward = minutes;
      let focusPotionActive = prev.player.focusPotionActive;
      if (focusPotionActive) {
        xpAward = Math.round(minutes * 1.5);
        focusPotionActive = false;
      }
      const nextData = {
        ...prev,
        player: { ...prev.player, todayStudyMinutes: todayStudyMins, focusPotionActive },
        sessions: [
          { id: 'sess_' + Date.now(), date: localDateStr(), durationMinutes: minutes, subject, xpEarned: xpAward },
          ...prev.sessions,
        ],
      };
      const streakResult = applyStudyStreak(nextData, localDateStr());
      announceStreak(streakResult.toastStreak);
      const res = addXpAndGold(streakResult.data, xpAward, Math.round(minutes / 3), showToast);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return res.data;
    });
  };

  // Subject Sync: one shared subjects list. A subject added in Learn is automatically
  // visible in Exam Time. Every new subject starts with its own empty examChapters list.
  const handleAddSubject = (name: string): string => {
    const id = 'sub_' + Date.now();
    const colors = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
    setData((prev) => {
      const newSub: Subject = {
        id,
        name: name.trim(),
        color: colors[prev.subjects.length % colors.length],
        chapters: [],
        examChapters: [],
      };
      return { ...prev, subjects: [...prev.subjects, newSub] };
    });
    showToast('Subject registered.');
    return id;
  };

  // Learn chapters only. These never appear in Exam Time.
  const handleAddChapter = (subjectId: string, title: string) => {
    setData((prev) => {
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === subjectId) {
          const newCh: Chapter = {
            id: 'ch_' + Date.now(),
            subjectId,
            title,
            learned: false,
            revisionCount: 0,
            intervalStage: 0,
            extractedToShadow: false,
          };
          return { ...sub, chapters: [...sub.chapters, newCh] };
        }
        return sub;
      });
      return { ...prev, subjects: updatedSubjects };
    });
    showToast('Chapter registered.');
  };

  // Exam Chapter Add: saved only into subject.examChapters, separate from Learn chapters.
  const handleAddExamChapter = (subjectId: string, title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const newExamCh: ExamChapter = {
      id: 'exam_ch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      subjectId,
      title: cleanTitle,
      examCompleted: false,
      examAriseClaimed: false,
    };
    setData((prev) => {
      if (!prev.subjects.some((sub) => sub.id === subjectId)) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) =>
          sub.id === subjectId
            ? { ...sub, examChapters: [...(sub.examChapters || []), newExamCh] }
            : sub
        ),
      };
    });
    showToast('Exam chapter registered.');
  };

  const handleMarkLearned = (subjectId: string, chapterId: string) => {
    setData((prev) => {
      const existingCh = prev.subjects.find((s) => s.id === subjectId)?.chapters.find((c) => c.id === chapterId);
      if (!existingCh || existingCh.learned) return prev;
      const todayStr = localDateStr();
      const nextRev = addDays(todayStr, 1);
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === subjectId) {
          const updatedChapters = sub.chapters.map((ch) => {
            if (ch.id === chapterId) {
              return { ...ch, learned: true, learnedDate: todayStr, nextRevisionDate: nextRev, intervalStage: 0 };
            }
            return ch;
          });
          return { ...sub, chapters: updatedChapters };
        }
        return sub;
      });
      const nextData = { ...prev, subjects: updatedSubjects };
      const streakResult = applyStudyStreak(nextData, todayStr);
      announceStreak(streakResult.toastStreak);
      const learnedToday = prev.subjects.reduce((n, sub) => n + sub.chapters.filter((c) => c.learnedDate === todayStr).length, 0);
      const learnCapped = learnedToday >= 5;
      if (learnCapped) showToast('Daily learn reward cap reached (5 chapters).');
      const res = addXpAndGold(streakResult.data, learnCapped ? 0 : 20, learnCapped ? 0 : 10, showToast);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return res.data;
    });
  };

  const handleReviewChapter = (subjectId: string, chapterId: string, rating: 'hard' | 'good' | 'easy') => {
    setData((prev) => {
      const chBefore = prev.subjects.find((s) => s.id === subjectId)?.chapters.find((c) => c.id === chapterId);
      const todayStr = localDateStr();
      if (!chBefore || !chBefore.learned || !chBefore.nextRevisionDate || chBefore.nextRevisionDate > todayStr) return prev;
      let usedScroll = false;
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === subjectId) {
          const updatedChapters = sub.chapters.map((ch) => {
            if (ch.id === chapterId) {
              let { nextStage, days } = getNextRevisionDays(ch.intervalStage, rating);
              if (prev.player.revisionScrollActive) {
                const extra = getNextRevisionDays(nextStage, 'good');
                nextStage = extra.nextStage;
                days = extra.days;
                usedScroll = true;
              }
              const nextRev = addDays(todayStr, days);
              return {
                ...ch,
                revisionCount: ch.revisionCount + 1,
                lastRevisionDate: todayStr,
                nextRevisionDate: nextRev,
                intervalStage: nextStage,
              };
            }
            return ch;
          });
          return { ...sub, chapters: updatedChapters };
        }
        return sub;
      });
      const newRevCount = chBefore.revisionCount + 1;
      const updatedShadows = prev.shadows.map((sh) => {
        if (sh.chapterId !== chapterId) return sh;
        const newGrade = gradeForRevisions(newRevCount);
        if (newGrade !== sh.grade) {
          showToast(`${sh.customNickname || sh.name} evolved to ${newGrade}!`);
        }
        return { ...sh, grade: newGrade, power: powerForRevisions(newRevCount), isDormant: false, lastRevisedDate: todayStr };
      });
      const nextData = {
        ...prev,
        subjects: updatedSubjects,
        shadows: updatedShadows,
        player: {
          ...prev.player,
          todayRevisionsDone: prev.player.todayRevisionsDone + 1,
          revisionScrollActive: usedScroll ? false : prev.player.revisionScrollActive,
        },
      };
      const streakResult = applyStudyStreak(nextData, todayStr);
      announceStreak(streakResult.toastStreak);
      const res = addXpAndGold(streakResult.data, 10, 5, showToast);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return res.data;
    });
  };

  const handleExtractShadow = (chapter: Chapter, subjectName: string) => {
    setData((prev) => {
      const srcChapter = prev.subjects.find((s) => s.id === chapter.subjectId)?.chapters.find((c) => c.id === chapter.id);
      if (!srcChapter || !srcChapter.learned || srcChapter.extractedToShadow || srcChapter.revisionCount < 2) return prev;
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === chapter.subjectId) {
          const updatedChapters = sub.chapters.map((ch) => (ch.id === chapter.id ? { ...ch, extractedToShadow: true } : ch));
          return { ...sub, chapters: updatedChapters };
        }
        return sub;
      });
      const shadowName = chapter.title + ' Shadow';
      const power = powerForRevisions(srcChapter.revisionCount);
      const newShadow = {
        id: 'sh_' + Date.now(),
        chapterId: chapter.id,
        name: shadowName,
        subjectName,
        grade: gradeForRevisions(srcChapter.revisionCount),
        power,
        lastRevisedDate: localDateStr(),
        isDormant: false,
        extractedDate: localDateStr(),
      };
      setAriseData({ shadowId: newShadow.id, shadowName, subjectName, grade: newShadow.grade, power });
      return {
        ...prev,
        subjects: updatedSubjects,
        shadows: [newShadow, ...prev.shadows],
      };
    });
  };

  // Exam Complete: only the matching entry in subject.examChapters is changed.
  // No lottery happens here. Learn chapters (subject.chapters) are never touched.
  const handleExamComplete = (chapterId: string) => {
    const target = dataRef.current.subjects
      .flatMap((subject) => subject.examChapters || [])
      .find((chapter) => chapter.id === chapterId);

    if (!target || target.examCompleted) return;

    setData((prev) => {
      const alreadyCompleted = prev.subjects.some((subject) =>
        (subject.examChapters || []).some((chapter) => chapter.id === chapterId && chapter.examCompleted)
      );

      if (alreadyCompleted) return prev;

      const updatedSubjects = prev.subjects.map((subject) => ({
        ...subject,
        examChapters: (subject.examChapters || []).map((chapter) =>
          chapter.id === chapterId
            ? { ...chapter, examCompleted: true }
            : chapter
        ),
      }));

      return { ...prev, subjects: updatedSubjects };
    });

    showToast('Chapter completed. ARISE reward unlocked!');
  };

  // ARISE Claim Reward (Lottery). Everything random happens once, outside any state updater.
  // 95%: +40 XP & +20 Gold. 5%: Shadow Extraction with a random rank.
  const handleClaimExamReward = (chapterId: string) => {
    if (claimLockRef.current) return;

    const current = dataRef.current;

    // A previous extraction still waits for its nickname: bring it back first.
    if (current.pendingExamChapterId) {
      showToast('Confirm the pending ARISE nickname first.');
      openPendingArise(current);
      return;
    }

    const sourceSubject = current.subjects.find((subject) =>
      (subject.examChapters || []).some((chapter) =>
        chapter.id === chapterId && chapter.examCompleted && !chapter.examAriseClaimed
      )
    );

    if (!sourceSubject) return;

    claimLockRef.current = true;

    try {
      // Mark the chapter as claimed right away so a refresh or double click cannot claim twice.
      const claimedData = markExamChapterClaimed(current, chapterId);
      const extracted = Math.random() < EXAM_EXTRACTION_CHANCE;

      // 95%: No Extraction -> points, chapter is removed.
      if (!extracted) {
        const base = removeExamChapter(claimedData, chapterId);
        const result = addXpAndGold(base, EXAM_NO_EXTRACTION_XP, EXAM_NO_EXTRACTION_GOLD, showToast);

        if (result.leveledUp) {
          setLevelUpData({
            oldLevel: result.oldLevel,
            newLevel: result.newLevel,
            rank: result.data.player.rank,
          });
        }

        commitData(result.data);
        showToast(`No Extraction. +${EXAM_NO_EXTRACTION_XP} XP & +${EXAM_NO_EXTRACTION_GOLD} Gold!`);
        return;
      }

      // 5%: Shadow Extraction. Rank is rolled independently for this extraction.
      const lowLuckRemaining = current.examLowLuckRemaining ?? 0;
      const lowLuckActive = lowLuckRemaining > 0;
      const rank = rollExamRank(lowLuckActive ? LOW_LUCK_RANK_WEIGHTS : NORMAL_RANK_WEIGHTS);
      const template = pickExamShadowTemplate(rank);

      // Existing duplicate protection: same member already in the Army.
      const duplicateExists = current.shadows.some(
        (shadow) => shadow.name === template.name && shadow.rank === template.rank
      );

      if (duplicateExists) {
        const bonus = getDuplicateReward();
        const base = removeExamChapter(claimedData, chapterId);
        const result = addXpAndGold(base, bonus.xp, bonus.gold, showToast);

        if (result.leveledUp) {
          setLevelUpData({
            oldLevel: result.oldLevel,
            newLevel: result.newLevel,
            rank: result.data.player.rank,
          });
        }

        // No new Shadow joined the Army, so the low-luck counter is not changed.
        commitData(result.data);
        showToast(
          `Duplicate ${template.rank}-Rank Shadow! +${bonus.xp} XP & +${bonus.gold} Gold.`
        );
        return;
      }

      // New Army Member. The chapter stays (pending) until the nickname is locked.
      const today = localDateStr();
      const newShadowId = 'exam_sh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const newShadow: Shadow = {
        id: newShadowId,
        chapterId,
        name: template.name,
        subjectName: sourceSubject.name,
        grade: template.grade,
        power: template.power,
        lastRevisedDate: today,
        isDormant: false,
        extractedDate: today,
        rank: template.rank,
      };

      let nextLowLuck = lowLuckRemaining;
      if (lowLuckActive) {
        nextLowLuck = Math.max(0, lowLuckRemaining - 1);
      } else if (template.rank === 'A') {
        nextLowLuck = EXAM_LOW_LUCK_COUNT;
      }

      commitData({
        ...claimedData,
        shadows: [newShadow, ...claimedData.shadows],
        pendingExamChapterId: chapterId,
        examLowLuckRemaining: nextLowLuck,
      });

      setAriseData({
        shadowId: newShadowId,
        shadowName: template.name,
        subjectName: sourceSubject.name,
        grade: `${template.rank}-RANK`,
        power: template.power,
      });

      showToast(`${template.rank}-Rank Army Member summoned!`);
    } finally {
      claimLockRef.current = false;
    }
  };

  // Permanent ARISE nickname: validated, saved and locked before the modal is allowed to close.
  // For a pending Exam extraction, the exam chapter is removed only after the lock succeeds.
  const handleConfirmAriseNickname = (
    shadowId: string,
    rawNickname: string
  ) => {
    const nickname = (rawNickname || '').trim();

    const target = data.shadows.find((s) => s.id === shadowId);

    if (!target) {
      showToast('Shadow not found. Nickname was not saved.');
      return;
    }

    if (!nickname) {
      showToast('Enter a nickname to continue.');
      return;
    }

    if (isNicknameLocked(target)) {
      setData((prev) => finalizePendingExam(prev, shadowId));
      confirmedAriseShadowIdRef.current = shadowId;
      setAriseData(null);
      return;
    }

    if (isNicknameTaken(data.shadows, nickname, shadowId)) {
      showToast('This nickname is already used. Choose another one.');
      return;
    }

    setData((prev) => {
      const current = prev.shadows.find((s) => s.id === shadowId);

      if (!current || isNicknameLocked(current)) return prev;

      if (isNicknameTaken(prev.shadows, nickname, shadowId)) {
        return prev;
      }

      const withNickname: AppData = {
        ...prev,
        shadows: prev.shadows.map((s) =>
          s.id === shadowId
            ? {
                ...s,
                customNickname: nickname,
                customNicknameLocked: true,
              }
            : s
        ),
      };

      // Only now (nickname locked) is the pending exam chapter removed.
      return finalizePendingExam(withNickname, shadowId);
    });

    confirmedAriseShadowIdRef.current = shadowId;
    showToast(`Nickname locked permanently: ${nickname}`);
    setAriseData(null);
  };

  // The ARISE modal can only close once its nickname has been saved.
  const handleCloseArise = () => {
    if (!ariseData) {
      setAriseData(null);
      return;
    }

    if (confirmedAriseShadowIdRef.current === ariseData.shadowId) {
      setAriseData(null);
      return;
    }

    const target = data.shadows.find((s) => s.id === ariseData.shadowId);
    if (!target || isNicknameLocked(target)) {
      setAriseData(null);
      return;
    }

    showToast('Confirm a permanent nickname to continue.');
  };

  const handleAddGate = (gate: Gate) => {
    setData((prev) => ({ ...prev, gates: [gate, ...prev.gates] }));
    showToast('New Dungeon Gate opened.');
  };

  const handleToggleGateStep = (gateId: string, stepId: string) => {
    setData((prev) => ({
      ...prev,
      gates: prev.gates.map((g) => {
        if (g.id === gateId) {
          const updatedSteps = g.steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s));
          return { ...g, steps: updatedSteps };
        }
        return g;
      }),
    }));
  };

  const handleCompleteBoss = (gateId: string) => {
    setData((prev) => {
      const gate = prev.gates.find((g) => g.id === gateId);
      if (!gate || gate.cleared || !gate.steps.every((st) => st.completed)) return prev;
      const updatedGates = prev.gates.map((g) => (g.id === gateId ? { ...g, bossCompleted: true, cleared: true, clearedDate: localDateStr() } : g));
      const nextData = { ...prev, gates: updatedGates };
      showToast('Boss Defeated! Gate Cleared. +' + gate.rewardXp + ' XP & +' + gate.rewardGold + ' Credits');
      const res = addXpAndGold(nextData, gate.rewardXp, gate.rewardGold);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return res.data;
    });
  };

  const handleStartExpedition = (shadow: Shadow) => {
    setData((prev) => {
      const already = prev.expeditions.some((e) => e.shadowId === shadow.id);
      if (already) return prev;
      if (prev.expeditions.length >= 3) {
        showToast('Only 3 expeditions can run at once.');
        return prev;
      }
      const newExp = {
        id: 'exp_' + Date.now(),
        shadowId: shadow.id,
        shadowName: shadow.customNickname || shadow.name,
        destination: shadow.subjectName + ' Ruins',
        durationMinutes: 60,
        startTime: Date.now(),
        rewardXp: 10,
        rewardGold: 5,
        completed: false,
      };
      showToast(`${shadow.customNickname || shadow.name} dispatched on a 60-minute expedition!`);
      return {
        ...prev,
        expeditions: [newExp, ...prev.expeditions],
      };
    });
  };

  const handleClaimExpedition = (expId: string) => {
    setData((prev) => {
      const exp = prev.expeditions.find((e) => e.id === expId);
      if (!exp || Date.now() - exp.startTime < exp.durationMinutes * 60000) return prev;
      const nextExpeditions = prev.expeditions.filter((e) => e.id !== expId);
      const nextData = { ...prev, expeditions: nextExpeditions };
      showToast(`Expedition successful! Claimed +${exp.rewardXp} XP and +${exp.rewardGold} Gold.`);
      const res = addXpAndGold(nextData, exp.rewardXp, exp.rewardGold, showToast);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return res.data;
    });
  };

  const handleClaimAchievement = (achievementId: string) => {
    setData((prev) => {
      const ach = prev.achievements.find((a) => a.id === achievementId);
      if (!ach || ach.claimed) return prev;

      const totalStudyMins = prev.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      const shadowCount = prev.shadows.length;
      const gateCount = prev.gates.filter((g) => g.cleared).length;
      const completedQuestCount = Math.max(prev.player.questsCompletedTotal || 0, prev.quests.filter((q) => q.completed).length);
      let totalRevisions = 0;
      prev.subjects.forEach((sub) => sub.chapters.forEach((ch) => (totalRevisions += ch.revisionCount)));

      const getMetricValue = (cat: string) => {
        switch (cat) {
          case 'Study Time': return totalStudyMins;
          case 'Discipline': return prev.player.streak;
          case 'Level': return prev.player.level;
          case 'Army': return shadowCount;
          case 'Gates': return gateCount;
          case 'Knowledge': return totalRevisions;
          case 'Quests': return completedQuestCount;
          default: return 0;
        }
      };

      const currentVal = getMetricValue(ach.category);
      if (currentVal < ach.targetValue) return prev;

      const updatedAchievements = prev.achievements.map((a) => (a.id === achievementId ? { ...a, unlocked: true, claimed: true } : a));
      const nextData = { ...prev, achievements: updatedAchievements };
      showToast(`Achievement Claimed: ${ach.title}! +${ach.rewardGold} Gold${ach.rewardGrowthPoints ? ` & +${ach.rewardGrowthPoints} Growth Point` : ''}`);
      const res = addXpAndGold(nextData, 0, ach.rewardGold, showToast);
      let newGp = res.data.player.growthPoints + (ach.rewardGrowthPoints || 0);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return {
        ...res.data,
        player: { ...res.data.player, growthPoints: newGp },
      };
    });
  };

  const handleAllocatePoint = (attr: keyof Player['attributes']) => {
    setData((prev) => {
      if (prev.player.growthPoints <= 0) return prev;
      const newVal = prev.player.attributes[attr] + 10;
      const grade = newVal >= 150 ? 'S' : newVal >= 120 ? 'A' : newVal >= 90 ? 'B' : newVal >= 70 ? 'C' : newVal >= 50 ? 'D' : 'E';
      return {
        ...prev,
        player: {
          ...prev.player,
          growthPoints: prev.player.growthPoints - 1,
          attributes: { ...prev.player.attributes, [attr]: newVal },
          attributeGrades: { ...prev.player.attributeGrades, [attr]: grade },
        },
      };
    });
    showToast('Attribute upgraded.');
  };

  const handleSelectPath = (path: JobPath) => {
    setData((prev) => ({ ...prev, player: { ...prev.player, path } }));
    showToast('Path selected: ' + path);
  };

  const handleUseResilience = () => {
    setData((prev) => {
      if (prev.player.resilienceUsedThisWeek) return prev;
      showToast('Resilience activated! Streak protected for this week.');
      return {
        ...prev,
        player: { ...prev.player, resilienceUsedThisWeek: true, resilienceUsedDate: localDateStr() },
      };
    });
  };

  const handleUnlockReward = (rewardId: string) => {
    setData((prev) => {
      const rw = prev.rewards.find((r) => r.id === rewardId);
      if (!rw || rw.unlocked || prev.player.gold < rw.costGold) return prev;
      showToast('Reward unlocked: ' + rw.title + '!');
      return {
        ...prev,
        player: { ...prev.player, gold: prev.player.gold - rw.costGold },
        rewards: prev.rewards.map((r) => (r.id === rewardId ? { ...r, unlocked: true, unlockedAt: Date.now() } : r)),
      };
    });
  };

  // Army rename: protected by the permanent-nickname lock and the duplicate-name check.
  const handleUpdateNickname = (shadowId: string, nickname: string) => {
    const cleanNickname = (nickname || '').trim();
    const target = data.shadows.find((s) => s.id === shadowId);

    if (!target) return;

    if (isNicknameLocked(target)) {
      showToast('This nickname is permanent and cannot be changed.');
      return;
    }

    if (!cleanNickname) {
      showToast('Nickname cannot be empty.');
      return;
    }

    if (isNicknameTaken(data.shadows, cleanNickname, shadowId)) {
      showToast('This nickname is already used by another Shadow. Choose a different one.');
      return;
    }

    setData((prev) => {
      const current = prev.shadows.find((s) => s.id === shadowId);
      if (!current || isNicknameLocked(current)) return prev;
      if (isNicknameTaken(prev.shadows, cleanNickname, shadowId)) return prev;
      return {
        ...prev,
        shadows: prev.shadows.map((s) =>
          s.id === shadowId ? { ...s, customNickname: cleanNickname, customNicknameLocked: true } : s
        ),
      };
    });

    showToast(`Nickname locked permanently: ${cleanNickname}`);
  };

  const handleVowBegin = (vowId: string, daysAlready: number) => {
    setData((prev) => {
      const v = prev.vow || defaultVow();
      const start = addDays(localDateStr(), -Math.max(0, daysAlready));
      return { ...prev, vow: { ...v, vows: v.vows.map((x) => (x.id === vowId ? { ...x, startDate: start } : x)) } };
    });
    showToast('Vow begun. Day by day.');
  };

  const handleVowRelapse = (vowId: string) => {
    setData((prev) => {
      const v = prev.vow || defaultVow();
      const today = localDateStr();
      return {
        ...prev,
        vow: {
          ...v,
          vows: v.vows.map((x) =>
            x.id === vowId
              ? { ...x, bestStreak: Math.max(x.bestStreak, vowStreakDays(x, today)), startDate: today, relapses: x.relapses + 1 }
              : x
          ),
        },
      };
    });
    showToast('Reset recorded. Your best streak is saved. Start again today.');
  };

  const handleVowTogglePrivate = () => {
    setData((prev) => {
      const v = prev.vow || defaultVow();
      return { ...prev, vow: { ...v, privateMode: !v.privateMode } };
    });
  };

  const handleVowClaim = (vowId: string, days: number) => {
    setData((prev) => {
      const v = prev.vow || defaultVow();
      const target = v.vows.find((x) => x.id === vowId);
      const reward = VOW_REWARDS[days];
      if (!target || !reward || !target.startDate || target.claimedMilestones.includes(days)) return prev;
      if (vowStreakDays(target, localDateStr()) < days) return prev;
      const nextData = {
        ...prev,
        vow: { ...v, vows: v.vows.map((x) => (x.id === vowId ? { ...x, claimedMilestones: [...x.claimedMilestones, days] } : x)) },
      };
      showToast(`Vow milestone: ${days} days! +${reward.xp} XP, +${reward.gold} Gold`);
      const res = addXpAndGold(nextData, reward.xp, reward.gold, showToast);
      if (res.leveledUp) {
        setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
      }
      return { ...res.data, player: { ...res.data.player, growthPoints: res.data.player.growthPoints + reward.gp } };
    });
  };

  const handleAddPlanner = (item: PlannerItem) => {
    setData((prev) => ({ ...prev, planner: [item, ...prev.planner] }));
    showToast('Task added to planner.');
  };

  const handleTogglePlanner = (id: string) => {
    setData((prev) => ({
      ...prev,
      planner: prev.planner.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p)),
    }));
  };

  const handleDeletePlanner = (id: string) => {
    setData((prev) => ({ ...prev, planner: prev.planner.filter((p) => p.id !== id) }));
  };

  const handleAddNote = (note: NoteItem) => {
    setData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
    showToast('Note saved.');
  };

  const handleTogglePinNote = (id: string) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    }));
  };

  const handleDeleteNote = (id: string) => {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
  };

  const handleUnlockSkill = (skillId: string) => {
    setData((prev) => {
      const skill = prev.skills.find((s) => s.id === skillId);
      if (!skill || skill.unlocked || prev.player.growthPoints < skill.costPoints) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          growthPoints: prev.player.growthPoints - skill.costPoints,
          activePassives: [...prev.player.activePassives, skill.name],
          unlockedSkills: [...prev.player.unlockedSkills, skillId],
        },
        skills: prev.skills.map((s) => (s.id === skillId ? { ...s, unlocked: true } : s)),
      };
    });
    showToast('Skill unlocked!');
  };

  const handleBuyItem = (item: ShopItem) => {
    setData((prev) => {
      if (prev.player.gold < item.cost) return prev;
      return {
        ...prev,
        player: { ...prev.player, gold: prev.player.gold - item.cost },
        shop: prev.shop.map((s) => (s.id === item.id ? { ...s, quantity: s.quantity + 1 } : s)),
      };
    });
    showToast('Purchased ' + item.name + '!');
  };

  const handleUseItem = (item: ShopItem) => {
    setData((prev) => {
      const shopItem = prev.shop.find((s) => s.id === item.id);
      if (!shopItem || shopItem.quantity <= 0) return prev;
      if (item.type === 'potion') {
        if (prev.player.focusPotionActive) return prev;
        showToast('Focus Potion activated: +50% XP on your next focus session.');
        return {
          ...prev,
          player: { ...prev.player, focusPotionActive: true },
          shop: prev.shop.map((s) => (s.id === item.id ? { ...s, quantity: s.quantity - 1 } : s)),
        };
      }
      if (item.type === 'scroll') {
        if (prev.player.revisionScrollActive) return prev;
        showToast('Revision Scroll activated: your next review jumps one extra stage.');
        return {
          ...prev,
          player: { ...prev.player, revisionScrollActive: true },
          shop: prev.shop.map((s) => (s.id === item.id ? { ...s, quantity: s.quantity - 1 } : s)),
        };
      }
      return prev;
    });
  };

  const handleUpdateSettings = (settings: AppSettings) => {
    setData((prev) => ({ ...prev, settings }));
    showToast('System settings updated.');
  };

  const handleResetData = () => {
    localStorage.removeItem('SHADOW_STUDY_DATA_V2');
    localStorage.removeItem('SHADOW_STUDY_WELCOME_DONE');
    localStorage.removeItem('SHADOW_STUDY_TIMER_STATE');
    setData(ensureExamChapters(loadAppData()));
    setCurrentTab('today');
  };

  const handleImportData = (imported: AppData) => {
    setData(ensureExamChapters(normalizeData(imported)));
    setTimeout(() => {
      runDailyCheck();
    }, 0);
  };

  let dueRevisionCount = 0;
  const dueToday = localDateStr();
  data.subjects.forEach((sub) => sub.chapters.forEach((ch) => {
    if (ch.learned && ch.nextRevisionDate && ch.nextRevisionDate <= dueToday) dueRevisionCount++;
  }));

  if (isOnboarding) {
    return (
      <BootOnboarding
        onComplete={handleCompleteOnboarding}
        soundEnabled={data.settings.soundEnabled}
      />
    );
  }

  const allNavItems = [
    { id: 'today', label: t('home', lang), icon: Home },
    { id: 'quests', label: t('quests', lang), icon: Target },
    { id: 'focus', label: t('timer', lang), icon: Clock },
    { id: 'learn', label: t('learn', lang), icon: BookOpen },
    { id: 'gates', label: t('gates', lang), icon: Shield },
    { id: 'army', label: t('army', lang), icon: Ghost },
    { id: 'character', label: t('status', lang), icon: User },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'vow', label: lang === 'bn' ? 'শপথ' : 'Vow', icon: Flame },
    { id: 'planner', label: t('planner', lang), icon: Calendar },
    { id: 'notes', label: t('notes', lang), icon: FileText },
    { id: 'insights', label: t('insights', lang), icon: BarChart2 },
    { id: 'skills', label: t('skills', lang), icon: Zap },
    { id: 'shop', label: t('shop', lang), icon: ShoppingBag },
    { id: 'season', label: t('season', lang), icon: Award },
    { id: 'settings', label: t('settings', lang), icon: SettingsIcon },
  ];

  const bottomNavItems = [
    { id: 'today', label: t('home', lang), icon: Home },
    { id: 'quests', label: t('quests', lang), icon: Target },
    { id: 'focus', label: t('timer', lang), icon: Clock },
    { id: 'learn', label: t('learn', lang), icon: BookOpen },
    { id: 'character', label: t('status', lang), icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#020205] text-[#f1f5f9] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0b0b14] border border-cyan-500/40 text-cyan-100 px-5 py-3 rounded-md shadow-[0_0_30px_rgba(0,240,255,0.25)] font-mono text-sm animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Status Window Modal */}
      {showStatusPopup && (
        <StatusWindowModal
          player={{ ...data.player, totalRevisionsDue: data.player.todayRevisionsDone + dueRevisionCount }}
          soundEnabled={data.settings.soundEnabled}
          onClose={() => setShowStatusPopup(false)}
          onAllocatePoint={handleAllocatePoint}
        />
      )}

      {/* ARISE Cinematic Modal */}
      {ariseData && (
        <AriseModal
          shadowId={ariseData.shadowId}
          shadowName={ariseData.shadowName}
          subjectName={ariseData.subjectName}
          grade={ariseData.grade}
          power={ariseData.power}
          soundEnabled={data.settings.soundEnabled}
          onClose={handleCloseArise}
          onConfirm={handleConfirmAriseNickname}
        />
      )}

      {/* Double Dungeon Modal */}
      {doubleDungeonTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md pro-card p-6 border-red-500/50 bg-slate-950 text-center space-y-4">
            <div className="text-red-400 font-mono text-xs tracking-widest uppercase">[ WARNING: DOUBLE DUNGEON DETECTED ]</div>
            <h2 className="text-xl font-bold text-white">An optional harder challenge has appeared!</h2>
            <p className="text-xs text-slate-400">You cleared "{doubleDungeonTitle}". Would you like to enter the Double Dungeon for rare rewards?</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDoubleDungeonTitle(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  const res = addXpAndGold(data, 150, 80, showToast);
                  if (res.leveledUp) {
                    setLevelUpData({ oldLevel: res.oldLevel, newLevel: res.newLevel, rank: res.data.player.rank });
                  }
                  setData(res.data);
                  setDoubleDungeonTitle(null);
                  showToast('Double Dungeon Conquered! +150 XP & +80 Credits');
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow cursor-pointer"
              >
                Conquer Double Dungeon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Celebration Overlay */}
      {levelUpData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-fadeIn">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(6,182,212,0.15),rgba(59,130,246,0.15),rgba(147,51,234,0.15),rgba(6,182,212,0.15))] animate-level-beams"></div>
          </div>
          <div className="relative bg-gradient-to-b from-[#0c0c16] via-[#08080f] to-black border border-cyan-400/70 rounded-sm p-8 shadow-[0_0_60px_rgba(0,240,255,0.35)] text-center animate-level-box system-card space-y-4 max-w-md w-full mx-4">
            <div className="text-cyan-400 font-mono text-xs tracking-widest uppercase">[ SYSTEM NOTIFICATION ]</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-100 font-mono tracking-wider">
              LEVEL UP!
            </h2>
            <div className="text-5xl font-black font-mono text-white tracking-widest py-2">
              {levelUpData.oldLevel} &rarr; <span className="text-cyan-400">{levelUpData.newLevel}</span>
            </div>
            <p className="text-xs font-mono text-cyan-200/80">
              Rank: <span className="text-cyan-400 font-bold">{levelUpData.rank}</span> | +1 Growth Point Awarded
            </p>
            <button
              onClick={() => setLevelUpData(null)}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase font-bold tracking-wider py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all cursor-pointer"
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}

      {/* Top Header with Hamburger Menu */}
      <header className="sticky top-0 z-40 sl-header px-4 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 text-blue-400 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="System Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 font-bold text-sm md:text-base tracking-[0.15em] uppercase font-mono">[{t('appTitle', lang)}]</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div
            onClick={() => setShowStatusPopup(true)}
            className="pro-card px-3 py-1.5 cursor-pointer hover:border-blue-500/50 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <span className="text-blue-400">{t('rank', lang)} {data.player.rank}</span>
            <span className="text-slate-400">|</span>
            <span className="text-white">{t('level', lang)} {data.player.level}</span>
          </div>
        </div>
      </header>

      {/* Slide-over Hamburger Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-80 max-w-[85vw] bg-[#07070e] border-r border-cyan-500/15 h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-blue-400 tracking-widest">SYSTEM DIRECTORY</div>
                <div className="text-base font-bold text-white">{data.player.name}</div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={
                      'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer ' +
                      (isActive
                        ? 'bg-blue-600 text-white font-semibold shadow'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white')
                    }
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-800 text-[11px] font-mono text-slate-400 text-center">
              Shadow Study v2.0 | Offline PWA
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24">
        {currentTab === 'today' && <TodayScreen data={data} onNavigate={setCurrentTab} onCompleteQuest={handleCompleteQuest} onOpenStatus={() => setShowStatusPopup(true)} />}
        {currentTab === 'quests' && <QuestsScreen data={data} onCompleteQuest={handleCompleteQuest} onAddQuest={handleAddQuest} onDeleteQuest={handleDeleteQuest} />}
        {currentTab === 'focus' && <FocusScreen data={data} onFinishSession={handleFinishFocusSession} />}
        {currentTab === 'learn' && (
          <LearnScreen
            data={data}
            onAddSubject={handleAddSubject}
            onAddChapter={handleAddChapter}
            onAddExamChapter={handleAddExamChapter}
            onMarkLearned={handleMarkLearned}
            onReviewChapter={handleReviewChapter}
            onExtractShadow={handleExtractShadow}
            onExamComplete={handleExamComplete}
            onClaimExamReward={handleClaimExamReward}
          />
        )}
        {currentTab === 'gates' && <GatesScreen data={data} onAddGate={handleAddGate} onToggleGateStep={handleToggleGateStep} onCompleteBoss={handleCompleteBoss} onTriggerDoubleDungeon={setDoubleDungeonTitle} />}
        {currentTab === 'army' && <ArmyScreen data={data} onUpdateNickname={handleUpdateNickname} onStartExpedition={handleStartExpedition} onClaimExpedition={handleClaimExpedition} />}
        {currentTab === 'character' && <CharacterScreen data={data} onAllocatePoint={handleAllocatePoint} onSelectPath={handleSelectPath} onUseResilience={handleUseResilience} onUnlockReward={handleUnlockReward} />}
        {currentTab === 'achievements' && <AchievementsScreen data={data} onClaimAchievement={handleClaimAchievement} />}
        {currentTab === 'vow' && <VowScreen data={data} onNavigate={setCurrentTab} onBegin={handleVowBegin} onRelapse={handleVowRelapse} onClaim={handleVowClaim} onTogglePrivate={handleVowTogglePrivate} />}
        {currentTab === 'planner' && <PlannerScreen data={data} onAddPlanner={handleAddPlanner} onTogglePlanner={handleTogglePlanner} onDeletePlanner={handleDeletePlanner} />}
        {currentTab === 'notes' && <NotesScreen data={data} onAddNote={handleAddNote} onTogglePin={handleTogglePinNote} onDeleteNote={handleDeleteNote} />}
        {currentTab === 'insights' && <InsightsScreen data={data} />}
        {currentTab === 'skills' && <SkillTreeScreen data={data} onUnlockSkill={handleUnlockSkill} />}
        {currentTab === 'shop' && <ShopScreen data={data} onBuyItem={handleBuyItem} onUseItem={handleUseItem} />}
        {currentTab === 'season' && <SeasonScreen data={data} />}
        {currentTab === 'settings' && <SettingsScreen data={data} onUpdateSettings={handleUpdateSettings} onResetData={handleResetData} onImportData={handleImportData} />}
      </div>

      {/* Bottom Quick Navigation Bar for Android / Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sl-bottom-nav flex justify-around py-2.5 px-1 md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={
                'flex-1 flex flex-col items-center gap-1 py-1.5 text-[0.65rem] uppercase tracking-wider transition-all cursor-pointer ' +
                (isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200')
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}