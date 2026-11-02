import { Achievement, AppData, AppSettings, Expedition, DailyEvaluation, Gate, NoteItem, PlannerItem, Player, Quest, RewardItem, SeasonData, ShopItem, SkillItem, Subject } from '../types';
import { localDateStr } from './date';

const STORAGE_KEY = 'SHADOW_STUDY_DATA_V2';

const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'dark',
  calmSkin: false,
  animationLevel: 'full',
  statusWindowFrequency: 'always',
  soundEnabled: true,
};

const defaultPlayer: Player = {
  name: '',
  level: 1,
  xp: 0,
  rank: 'E',
  title: 'The Weakest Player',
  path: 'None',
  gold: 0,
  growthPoints: 0,
  attributes: {
    knowledge: 10,
    focus: 10,
    discipline: 10,
    memory: 10,
    planning: 10,
    consistency: 10,
    creativity: 10,
    vitality: 10,
  },
  attributeGrades: {
    knowledge: 'F',
    focus: 'F',
    discipline: 'F',
    memory: 'F',
    planning: 'F',
    consistency: 'F',
    creativity: 'F',
    vitality: 'F',
  },
  dailyGoalMinutes: 60,
  todayStudyMinutes: 0,
  todayRevisionsDone: 0,
  totalRevisionsDue: 0,
  fatigueMinutes: 0,
  streak: 1,
  lastActiveDate: localDateStr(),
  lastStudyDate: '',
  resilienceUsedThisWeek: false,
  resilienceUsedDate: '',
  focusPotionActive: false,
  revisionScrollActive: false,
  activePassives: [],
  unlockedSkills: [],
  unlockedTitles: ['The Weakest Player'],
  completedDailySet: false,
  lastStatusPopupDate: '',
};

const defaultQuests: Quest[] = [
  {
    id: 'q1',
    title: 'Morning Awakening',
    description: 'Review flashcards or read 1 chapter before 10 AM',
    type: 'daily',
    difficulty: 'easy',
    xpReward: 10,
    goldReward: 5,
    completed: false,
  },
  {
    id: 'q2',
    title: 'Focus Mastery',
    description: 'Complete a 25-minute Pomodoro study session without distraction',
    type: 'daily',
    difficulty: 'medium',
    xpReward: 25,
    goldReward: 12,
    completed: false,
    targetMinutes: 25,
  },
];

const defaultShop: ShopItem[] = [
  { id: 'shop1', name: 'Focus Potion', description: 'Grants +50% XP on your next focus session', cost: 30, type: 'potion', icon: 'FlaskConical', quantity: 0 },
  { id: 'shop2', name: 'Revision Scroll', description: 'Automatically upgrades a revision interval stage', cost: 50, type: 'scroll', icon: 'Scroll', quantity: 0 },
  { id: 'shop3', name: 'Streak Shield', description: 'Protects your streak if you miss a day', cost: 100, type: 'shield', icon: 'Shield', quantity: 0 },
];

const defaultSkills: SkillItem[] = [
  { id: 'sk1', name: 'Hyper Focus', category: 'Focus', description: 'Focus sessions 45m+ grant +20% bonus XP', costPoints: 2, unlocked: false, bonusText: '+20% XP for long focus' },
  { id: 'sk2', name: 'Iron Discipline', category: 'Discipline', description: 'Daily goals give +30 XP instead of +20', costPoints: 3, unlocked: false, bonusText: '+10 Daily Goal XP' },
  { id: 'sk3', name: 'Eidetic Memory', category: 'Knowledge', description: 'Spaced revision interval scaling is accelerated by 10%', costPoints: 3, unlocked: false, bonusText: 'Faster spaced intervals' },
  { id: 'sk4', name: 'Time Bending', category: 'Time Management', description: 'Unlocks custom timer intervals up to 90 minutes', costPoints: 2, unlocked: false, bonusText: 'Custom 90m timer' },
];

const defaultRewards: RewardItem[] = [
  { id: 'rw1', title: 'Watch favorite movie / series episode (2 hours)', category: 'Leisure', unlocked: false, costGold: 250 },
  { id: 'rw2', title: 'Special feast / favorite snack or treat', category: 'Treats', unlocked: false, costGold: 150 },
  { id: 'rw3', title: '2 hours guilt-free gaming session', category: 'Gaming', unlocked: false, costGold: 400 },
  { id: 'rw4', title: 'Day out with friends / Leisure trip', category: 'Trips', unlocked: false, costGold: 1000 },
  { id: 'rw5', title: 'New book, gadget or study accessory', category: 'Study Gear', unlocked: false, costGold: 2500 },
  { id: 'rw6', title: 'Extra 1 hour afternoon nap / deep rest', category: 'Rest & Sleep', unlocked: false, costGold: 120 },
  { id: 'rw7', title: 'Social media / YouTube browsing pass (1 hour)', category: 'Social', unlocked: false, costGold: 200 },
];

function generateAchievements(): Achievement[] {
  const list: Achievement[] = [];
  let idCounter = 1;

  const timeTargets = [15, 30, 60, 120, 300, 600, 1200, 1800, 3000, 4500, 6000, 9000, 12000, 15000, 20000, 25000, 30000, 40000, 50000];
  timeTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 7 ? 'Silver' : idx < 11 ? 'Gold' : idx < 15 ? 'Platinum' : idx < 18 ? 'Diamond' : 'Monarch';
    list.push({
      id: `ach_time_${idCounter++}`,
      title: `Study Milestone T-${idx + 1}`,
      description: `Accumulate ${target} total minutes of study time`,
      category: 'Study Time',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 20 + idx * 15,
      rewardGrowthPoints: idx % 4 === 0 ? 1 : undefined,
    });
  });

  const streakTargets = [1, 3, 5, 7, 10, 14, 21, 30, 45, 60, 75, 90, 100, 120, 150, 180, 200, 250, 300, 365];
  streakTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 7 ? 'Silver' : idx < 11 ? 'Gold' : idx < 15 ? 'Platinum' : idx < 18 ? 'Diamond' : 'Monarch';
    list.push({
      id: `ach_str_${idCounter++}`,
      title: `Streak Legend T-${idx + 1}`,
      description: `Maintain a ${target}-day study streak`,
      category: 'Discipline',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 30 + idx * 20,
      rewardGrowthPoints: idx % 3 === 0 ? 1 : undefined,
    });
  });

  const levelTargets = [2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 75, 85, 90, 100];
  levelTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 7 ? 'Silver' : idx < 11 ? 'Gold' : idx < 15 ? 'Platinum' : idx < 18 ? 'Diamond' : 'Monarch';
    list.push({
      id: `ach_lvl_${idCounter++}`,
      title: `Hunter Awakening T-${idx + 1}`,
      description: `Reach Level ${target}`,
      category: 'Level',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 40 + idx * 25,
      rewardGrowthPoints: 1,
    });
  });

  const armyTargets = [1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 30, 35, 40, 50];
  armyTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 6 ? 'Silver' : idx < 10 ? 'Gold' : idx < 13 ? 'Platinum' : 'Monarch';
    list.push({
      id: `ach_arm_${idCounter++}`,
      title: `Shadow Legion T-${idx + 1}`,
      description: `Extract ${target} shadows into your army`,
      category: 'Army',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 50 + idx * 30,
      rewardGrowthPoints: idx % 3 === 0 ? 1 : undefined,
    });
  });

  const gateTargets = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50];
  gateTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 6 ? 'Silver' : idx < 10 ? 'Gold' : idx < 13 ? 'Platinum' : 'Monarch';
    list.push({
      id: `ach_gate_${idCounter++}`,
      title: `Gate Conqueror T-${idx + 1}`,
      description: `Clear ${target} Dungeon Gates`,
      category: 'Gates',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 50 + idx * 30,
      rewardGrowthPoints: idx % 3 === 0 ? 1 : undefined,
    });
  });

  const revTargets = [1, 3, 5, 10, 15, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200];
  revTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 6 ? 'Silver' : idx < 10 ? 'Gold' : idx < 13 ? 'Platinum' : 'Monarch';
    list.push({
      id: `ach_rev_${idCounter++}`,
      title: `Archive Master T-${idx + 1}`,
      description: `Complete ${target} Spaced Revisions`,
      category: 'Knowledge',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 40 + idx * 25,
      rewardGrowthPoints: idx % 4 === 0 ? 1 : undefined,
    });
  });

  const questTargets = [1, 3, 5, 10, 15, 20, 30, 40, 50, 75, 90, 100];
  questTargets.forEach((target, idx) => {
    const tier = idx < 3 ? 'Bronze' : idx < 6 ? 'Silver' : idx < 9 ? 'Gold' : 'Platinum';
    list.push({
      id: `ach_qst_${idCounter++}`,
      title: `Quest Master T-${idx + 1}`,
      description: `Complete ${target} Quests`,
      category: 'Quests',
      tier,
      targetValue: target,
      unlocked: false,
      claimed: false,
      rewardGold: 35 + idx * 20,
    });
  });

  return list;
}

const defaultAchievements = generateAchievements();

const defaultSeason: SeasonData = {
  currentWeek: 1,
  seasonName: 'Season I: Awakening of the Shadow',
  active: true,
  bossDefeated: false,
};

function normalizeData(parsed: AppData): AppData {
  const now = Date.now();
  const rewards = (parsed.rewards || defaultRewards).map((rw) => {
    if (rw.unlocked && rw.unlockedAt && now - rw.unlockedAt > 24 * 60 * 60 * 1000) {
      return { ...rw, unlocked: false, unlockedAt: undefined };
    }
    return rw;
  });

  return {
    ...parsed,
    player: { ...defaultPlayer, ...(parsed.player || {}) },
    settings: { ...defaultSettings, ...(parsed.settings || {}) },
    quests: parsed.quests || defaultQuests,
    subjects: parsed.subjects || [],
    shadows: parsed.shadows || [],
    gates: parsed.gates || [],
    planner: parsed.planner || [],
    notes: parsed.notes || [],
    shop: parsed.shop || defaultShop,
    skills: parsed.skills || defaultSkills,
    rewards,
    expeditions: parsed.expeditions || [],
    achievements: parsed.achievements || defaultAchievements,
    evaluations: parsed.evaluations || [],
    season: parsed.season || defaultSeason,
    sessions: parsed.sessions || [],
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppData = {
        player: defaultPlayer,
        quests: defaultQuests,
        subjects: [],
        shadows: [],
        gates: [],
        planner: [],
        notes: [],
        shop: defaultShop,
        skills: defaultSkills,
        rewards: defaultRewards,
        expeditions: [],
        achievements: defaultAchievements,
        evaluations: [],
        season: defaultSeason,
        sessions: [],
        settings: defaultSettings,
        lastLoginDate: localDateStr(),
      };
      saveAppData(initial);
      return initial;
    }
    const parsed: AppData = JSON.parse(raw);
    return normalizeData(parsed);
  } catch {
    const fallback: AppData = {
      player: defaultPlayer,
      quests: defaultQuests,
      subjects: [],
      shadows: [],
      gates: [],
      planner: [],
      notes: [],
      shop: defaultShop,
      skills: defaultSkills,
      rewards: defaultRewards,
      expeditions: [],
      achievements: defaultAchievements,
      evaluations: [],
      season: defaultSeason,
      sessions: [],
      settings: defaultSettings,
      lastLoginDate: localDateStr(),
    };
    return fallback;
  }
}

export function saveAppData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function exportBackup(data: AppData) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'shadow_study_backup_' + localDateStr() + '.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBackup(jsonString: string): AppData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.player && parsed.quests) {
      const normalized = normalizeData(parsed as AppData);
      saveAppData(normalized);
      return normalized;
    }
    return null;
  } catch {
    return null;
  }
}
