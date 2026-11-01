import React, { useState, useEffect } from 'react';
import { AppData, AppSettings, Chapter, Gate, JobPath, NoteItem, PlannerItem, Player, Quest, ShopItem, Subject } from './types';
import { loadAppData, saveAppData } from './utils/storage';
import { addXpAndGold, getNextRevisionDays } from './utils/gameLogic';
import { localDateStr, daysBetween, addDays } from './utils/date';
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
import {
  Home, Target, Clock, BookOpen, Ghost, Shield, User,
  Calendar, FileText, BarChart2, Zap, ShoppingBag, Award, Settings as SettingsIcon, Menu, X, Sparkles
} from 'lucide-react';

// Streak: +1 once per local day, on the first XP-earning study action.
// Returns the updated data and the new streak number to announce (0 = no toast).
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

export default function App() {
  const [data, setData] = useState<AppData>(loadAppData);
  const [currentTab, setCurrentTab] = useState<string>('today');
  const [showStatusPopup, setShowStatusPopup] = useState<boolean>(false);
  const [ariseData, setAriseData] = useState<{ shadowName: string; subjectName: string; grade: string; power: number } | null>(null);
  const [doubleDungeonTitle, setDoubleDungeonTitle] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const lang = data.settings.language;
  // Welcome flag: only used as a silent marker. The real signal for onboarding
  // is "does the player have a valid name?".
  const isWelcomeDone = typeof localStorage !== 'undefined' && localStorage.getItem('SHADOW_STUDY_WELCOME_DONE') === '1';
  const hasValidName = Boolean(data.player.name && data.player.name !== 'Player');

  // If user already has a valid name but the flag is missing (legacy user from
  // before this update), silently mark them as welcome-done so they do NOT see
  // the New/Old Hunter screen again.
  useEffect(() => {
    if (hasValidName && !isWelcomeDone) {
      try {
        localStorage.setItem('SHADOW_STUDY_WELCOME_DONE', '1');
      } catch {
        // ignore
      }
    }
  }, [hasValidName, isWelcomeDone]);

  // Onboarding is now shown ONLY when the user has no valid name.
  // After Reset Data the name is empty, so the screen appears again — correct.
  const isOnboarding = !hasValidName;

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // New-day check. Runs on load AND every time the app comes back to the
  // foreground (an installed PWA can stay in the background for days).
  const runDailyCheck = () => {
    const todayStr = localDateStr();
    setData((prev) => {
      const lastActive = prev.player.lastActiveDate;
      if (!lastActive || lastActive === todayStr) return prev;
      const diffDays = daysBetween(lastActive, todayStr);
      if (diffDays < 0) return prev; // device clock moved backwards: ignore

      let streak = prev.player.streak;
      let shop = prev.shop;
      let lastStudyDate = prev.player.lastStudyDate;
      if (diffDays > 1) {
        const shieldItem = prev.shop.find((s) => s.type === 'shield' && s.quantity > 0);
        if (prev.player.resilienceUsedThisWeek) {
          showToast('Streak protected by Resilience!');
        } else if (diffDays === 2 && prev.player.streak > 1 && shieldItem) {
          // Streak Shield: saves exactly one missed day. The next study counts as consecutive.
          shop = prev.shop.map((s) => (s.id === shieldItem.id ? { ...s, quantity: s.quantity - 1 } : s));
          lastStudyDate = addDays(todayStr, -1);
          showToast('Streak Shield used! Your streak is saved.');
        } else {
          streak = 1;
          showToast('Streak reset due to inactivity. A Comeback Quest has been issued.');
        }
      }

      // Resilience can be used once per 7 days (counted from the day it was activated).
      let resilienceUsed = prev.player.resilienceUsedThisWeek;
      let resilienceDate = prev.player.resilienceUsedDate || '';
      if (resilienceUsed) {
        if (!resilienceDate) {
          resilienceDate = lastActive;
        } else if (daysBetween(resilienceDate, todayStr) >= 7) {
          resilienceUsed = false;
        }
      }

      // Daily quests come back every new day; finished comeback quests are removed.
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

      return {
        ...prev,
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

  // Shown a moment later so it does not hide the XP / level-up message.
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
      return addXpAndGold(streakResult.data, quest.xpReward, quest.goldReward, showToast);
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
      let xpAward = minutes * 2;
      let focusPotionActive = prev.player.focusPotionActive;
      if (focusPotionActive) {
        xpAward = Math.round(minutes * 2 * 1.5);
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
      return addXpAndGold(streakResult.data, xpAward, Math.round(minutes / 2), showToast);
    });
  };

  const handleAddSubject = (name: string): string => {
    const id = 'sub_' + Date.now();
    const colors = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
    setData((prev) => {
      const newSub: Subject = {
        id,
        name: name.trim(),
        color: colors[prev.subjects.length % colors.length],
        chapters: [],
      };
      return { ...prev, subjects: [...prev.subjects, newSub] };
    });
    showToast('Subject registered.');
    return id;
  };

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

  const handleMarkLearned = (subjectId: string, chapterId: string) => {
    setData((prev) => {
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
      return addXpAndGold(streakResult.data, 30, 15, showToast);
    });
  };

  const handleReviewChapter = (subjectId: string, chapterId: string, rating: 'hard' | 'good' | 'easy') => {
    setData((prev) => {
      const todayStr = localDateStr();
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

      const nextData = {
        ...prev,
        subjects: updatedSubjects,
        player: {
          ...prev.player,
          todayRevisionsDone: prev.player.todayRevisionsDone + 1,
          revisionScrollActive: usedScroll ? false : prev.player.revisionScrollActive,
        },
      };
      const streakResult = applyStudyStreak(nextData, todayStr);
      announceStreak(streakResult.toastStreak);
      return addXpAndGold(streakResult.data, 20, 10, showToast);
    });
  };

  const handleExtractShadow = (chapter: Chapter, subjectName: string) => {
    setData((prev) => {
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === chapter.subjectId) {
          const updatedChapters = sub.chapters.map((ch) => (ch.id === chapter.id ? { ...ch, extractedToShadow: true } : ch));
          return { ...sub, chapters: updatedChapters };
        }
        return sub;
      });

      const shadowName = chapter.title + ' Shadow';
      const power = 100 + chapter.revisionCount * 25;
      const newShadow = {
        id: 'sh_' + Date.now(),
        chapterId: chapter.id,
        name: shadowName,
        subjectName,
        grade: 'Soldier' as const,
        power,
        lastRevisedDate: localDateStr(),
        isDormant: false,
        extractedDate: localDateStr(),
      };

      setAriseData({ shadowName, subjectName, grade: 'Soldier', power });

      return {
        ...prev,
        subjects: updatedSubjects,
        shadows: [newShadow, ...prev.shadows],
      };
    });
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
      if (!gate || gate.cleared) return prev;

      const updatedGates = prev.gates.map((g) => (g.id === gateId ? { ...g, bossCompleted: true, cleared: true, clearedDate: localDateStr() } : g));
      const nextData = { ...prev, gates: updatedGates };
      showToast('Boss Defeated! Gate Cleared. +' + gate.rewardXp + ' XP & +' + gate.rewardGold + ' Credits');
      return addXpAndGold(nextData, gate.rewardXp, gate.rewardGold);
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
        rewards: prev.rewards.map((r) => (r.id === rewardId ? { ...r, unlocked: true, unlockedDate: localDateStr() } : r)),
      };
    });
  };

  const handleUpdateNickname = (shadowId: string, nickname: string) => {
    setData((prev) => ({
      ...prev,
      shadows: prev.shadows.map((s) => (s.id === shadowId ? { ...s, customNickname: nickname } : s)),
    }));
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
    window.location.reload();
  };

  const handleImportData = (imported: AppData) => {
    setData(imported);
  };

  if (isOnboarding) {
    return (
      <BootOnboarding
        onComplete={handleCompleteOnboarding}
        soundEnabled={data.settings.soundEnabled}
      />
    );
  }

  // All 14 system menus including Dungeon Gates
  const allNavItems = [
    { id: 'today', label: t('home', lang), icon: Home },
    { id: 'quests', label: t('quests', lang), icon: Target },
    { id: 'focus', label: t('timer', lang), icon: Clock },
    { id: 'learn', label: t('learn', lang), icon: BookOpen },
    { id: 'gates', label: t('gates', lang), icon: Shield },
    { id: 'army', label: t('army', lang), icon: Ghost },
    { id: 'character', label: t('status', lang), icon: User },
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
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0f172a] border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-3 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Status Window Modal */}
      {showStatusPopup && (
        <StatusWindowModal
          player={data.player}
          soundEnabled={data.settings.soundEnabled}
          onClose={() => setShowStatusPopup(false)}
          onAllocatePoint={handleAllocatePoint}
        />
      )}

      {/* ARISE Cinematic Modal */}
      {ariseData && (
        <AriseModal
          shadowName={ariseData.shadowName}
          subjectName={ariseData.subjectName}
          grade={ariseData.grade}
          power={ariseData.power}
          soundEnabled={data.settings.soundEnabled}
          onClose={() => setAriseData(null)}
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
                className="flex-1 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setData((prev) => addXpAndGold(prev, 150, 80, showToast));
                  setDoubleDungeonTitle(null);
                  showToast('Double Dungeon Conquered! +150 XP & +80 Credits');
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow"
              >
                Conquer Double Dungeon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header with Hamburger Menu */}
      <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 text-blue-400 border border-slate-800 hover:border-slate-700 transition-colors"
            title="System Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-blue-400 font-bold text-sm md:text-base tracking-wider uppercase font-mono">[{t('appTitle', lang)}]</span>
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

          <div className="relative w-80 max-w-[85vw] bg-[#0f172a] border-r border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-blue-400 tracking-widest uppercase">SYSTEM DIRECTORY</div>
                <div className="text-base font-bold text-white">{data.player.name}</div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
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
                      'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-medium transition-all ' +
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
              Shadow Study v1.0 • Offline PWA
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24">
        {currentTab === 'today' && <TodayScreen data={data} onNavigate={setCurrentTab} onCompleteQuest={handleCompleteQuest} onOpenStatus={() => setShowStatusPopup(true)} />}
        {currentTab === 'quests' && <QuestsScreen data={data} onCompleteQuest={handleCompleteQuest} onAddQuest={handleAddQuest} onDeleteQuest={handleDeleteQuest} />}
        {currentTab === 'focus' && <FocusScreen data={data} onFinishSession={handleFinishFocusSession} />}
        {currentTab === 'learn' && <LearnScreen data={data} onAddSubject={handleAddSubject} onAddChapter={handleAddChapter} onMarkLearned={handleMarkLearned} onReviewChapter={handleReviewChapter} onExtractShadow={handleExtractShadow} />}
        {currentTab === 'gates' && <GatesScreen data={data} onAddGate={handleAddGate} onToggleGateStep={handleToggleGateStep} onCompleteBoss={handleCompleteBoss} onTriggerDoubleDungeon={setDoubleDungeonTitle} />}
        {currentTab === 'army' && <ArmyScreen data={data} onUpdateNickname={handleUpdateNickname} />}
        {currentTab === 'character' && <CharacterScreen data={data} onAllocatePoint={handleAllocatePoint} onSelectPath={handleSelectPath} onUseResilience={handleUseResilience} onUnlockReward={handleUnlockReward} />}
        {currentTab === 'planner' && <PlannerScreen data={data} onAddPlanner={handleAddPlanner} onTogglePlanner={handleTogglePlanner} onDeletePlanner={handleDeletePlanner} />}
        {currentTab === 'notes' && <NotesScreen data={data} onAddNote={handleAddNote} onTogglePin={handleTogglePinNote} onDeleteNote={handleDeleteNote} />}
        {currentTab === 'insights' && <InsightsScreen data={data} />}
        {currentTab === 'skills' && <SkillTreeScreen data={data} onUnlockSkill={handleUnlockSkill} />}
        {currentTab === 'shop' && <ShopScreen data={data} onBuyItem={handleBuyItem} onUseItem={handleUseItem} />}
        {currentTab === 'season' && <SeasonScreen data={data} />}
        {currentTab === 'settings' && <SettingsScreen data={data} onUpdateSettings={handleUpdateSettings} onResetData={handleResetData} onImportData={handleImportData} />}
      </div>

      {/* Bottom Quick Navigation Bar for Android / Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/98 border-t border-slate-800 flex justify-around py-2 px-1 backdrop-blur md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={
                'flex-1 flex flex-col items-center gap-1 py-1.5 text-[0.65rem] uppercase tracking-wider transition-all ' +
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