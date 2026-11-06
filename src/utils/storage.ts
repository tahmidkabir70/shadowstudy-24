
import {
  Achievement, AppData, AppSettings, Player, Quest, RewardItem,
  SeasonData, ShopItem, SkillItem
} from '../types';
import { localDateStr, seasonWeek } from './date';
import { defaultVow } from './vow';

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
    knowledge: 10, focus: 10, discipline: 10, memory: 10,
    planning: 10, consistency: 10, creativity: 10, vitality: 10,
  },
  attributeGrades: {
    knowledge: 'F', focus: 'F', discipline: 'F', memory: 'F',
    planning: 'F', consistency: 'F', creativity: 'F', vitality: 'F',
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
  let id = 1;

  const add = (
    targets: number[],
    category: Achievement['category'],
    title: string,
    description: (target: number) => string,
    tierFor: (index: number) => Achievement['tier'],
    gold: (index: number) => number,
    growth?: (index: number) => number | undefined
  ) => {
    targets.forEach((target, index) => {
      list.push({
        id: `ach_${category.toLowerCase().replaceAll(' ', '_')}_${id++}`,
        title: `${title} T-${index + 1}`,
        description: description(target),
        category,
        tier: tierFor(index),
        targetValue: target,
        unlocked: false,
        claimed: false,
        rewardGold: gold(index),
        rewardGrowthPoints: growth?.(index),
      });
    });
  };

  const tier = (i: number): Achievement['tier'] =>
    i < 3 ? 'Bronze' : i < 7 ? 'Silver' : i < 11 ? 'Gold' : i < 15 ? 'Platinum' : i < 18 ? 'Diamond' : 'Monarch';

  add([60,180,360,600,1200,1800,3000,4500,6000,9000,12000,15000,21000,30000,42000,60000,90000,120000,180000], 'Study Time', 'Study Milestone', n => `Accumulate ${n} total minutes of study time`, tier, i => 20 + i * 15, i => i % 4 === 0 ? 1 : undefined);
  add([3,7,14,21,30,45,60,75,90,120,150,180,240,300,365,450,540,730,900,1095], 'Discipline', 'Streak Legend', n => `Maintain a ${n}-day study streak`, tier, i => 30 + i * 20, i => i % 3 === 0 ? 1 : undefined);
  add([5,8,10,15,20,25,30,35,40,45,50,55,60,65,70,75,85,90,100], 'Level', 'Hunter Awakening', n => `Reach Level ${n}`, tier, i => 40 + i * 25, () => 1);
  add([3,5,8,12,16,20,25,30,40,50,60,75,90,110,130], 'Army', 'Shadow Legion', n => `Extract ${n} shadows into your army`, tier, i => 50 + i * 30, i => i % 3 === 0 ? 1 : undefined);
  add([1,3,5,8,12,16,20,25,30,40,50,65,80,100,130], 'Gates', 'Gate Conqueror', n => `Clear ${n} Dungeon Gates`, tier, i => 50 + i * 30, i => i % 3 === 0 ? 1 : undefined);
  add([5,15,30,50,80,120,180,250,350,500,700,900,1200,1600,2000], 'Knowledge', 'Archive Master', n => `Complete ${n} Spaced Revisions`, tier, i => 40 + i * 25, i => i % 4 === 0 ? 1 : undefined);
  add([5,15,30,60,100,150,250,400,600,900,1300,2000], 'Quests', 'Quest Master', n => `Complete ${n} Quests`, i => i < 3 ? 'Bronze' : i < 6 ? 'Silver' : i < 9 ? 'Gold' : 'Platinum', i => 35 + i * 20);

  return list;
}

const defaultAchievements = generateAchievements();

const defaultSeason: SeasonData = {
  currentWeek: 1,
  seasonName: 'Season I: Awakening of the Shadow',
  active: true,
  bossDefeated: false,
  startDate: localDateStr(),
};

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

function mergeAchievements(saved: unknown): Achievement[] {
  if (!isArray(saved)) return defaultAchievements;

  const claimed = new Map<string, Achievement>();

  saved.forEach((item) => {
    if (isRecord(item) && typeof item.id === 'string' && item.claimed === true) {
      claimed.set(item.id, item as unknown as Achievement);
    }
  });

  return defaultAchievements.map((achievement) => claimed.get(achievement.id) || achievement);
}

export function normalizeData(input: AppData): AppData {
  const parsed = isRecord(input) ? input : {};
  const playerInput = isRecord(parsed.player) ? parsed.player : {};
  const attributesInput = isRecord(playerInput.attributes) ? playerInput.attributes : {};
  const gradesInput = isRecord(playerInput.attributeGrades) ? playerInput.attributeGrades : {};

  const player: Player = {
    ...defaultPlayer,
    ...playerInput,
    attributes: {
      ...defaultPlayer.attributes,
      ...attributesInput,
    },
    attributeGrades: {
      ...defaultPlayer.attributeGrades,
      ...gradesInput,
    },
    activePassives: isArray(playerInput.activePassives) ? playerInput.activePassives : [],
    unlockedSkills: isArray(playerInput.unlockedSkills) ? playerInput.unlockedSkills : [],
    unlockedTitles: isArray(playerInput.unlockedTitles) ? playerInput.unlockedTitles : ['The Weakest Player'],
  };

  const settings: AppSettings = {
    ...defaultSettings,
    ...(isRecord(parsed.settings) ? parsed.settings : {}),
  };

  const seasonBase = {
    ...defaultSeason,
    ...(isRecord(parsed.season) ? parsed.season : {}),
  };

  const seasonStart = typeof seasonBase.startDate === 'string' && seasonBase.startDate
    ? seasonBase.startDate
    : localDateStr();

  const season: SeasonData = {
    ...seasonBase,
    startDate: seasonStart,
    currentWeek: seasonWeek(seasonStart, localDateStr()),
  };

  const rewardsInput = isArray(parsed.rewards) ? parsed.rewards : defaultRewards;
  const rewards = rewardsInput.filter(isRecord).map((reward) => {
    if (
      reward.unlocked === true &&
      typeof reward.unlockedAt === 'number' &&
      Date.now() - reward.unlockedAt > 24 * 60 * 60 * 1000
    ) {
      return { ...reward, unlocked: false, unlockedAt: undefined };
    }
    return reward;
  }) as RewardItem[];

  return {
    ...parsed,
    player,
    settings,
    quests: isArray(parsed.quests) ? parsed.quests as Quest[] : defaultQuests,
    subjects: isArray(parsed.subjects) ? parsed.subjects : [],
    shadows: isArray(parsed.shadows) ? parsed.shadows : [],
    gates: isArray(parsed.gates) ? parsed.gates : [],
    planner: isArray(parsed.planner) ? parsed.planner : [],
    notes: isArray(parsed.notes) ? parsed.notes : [],
    shop: isArray(parsed.shop) ? parsed.shop as ShopItem[] : defaultShop,
    skills: isArray(parsed.skills) ? parsed.skills as SkillItem[] : defaultSkills,
    rewards,
    expeditions: isArray(parsed.expeditions) ? parsed.expeditions : [],
    achievements: mergeAchievements(parsed.achievements),
    evaluations: isArray(parsed.evaluations) ? parsed.evaluations : [],
    season,
    sessions: isArray(parsed.sessions) ? parsed.sessions : [],
    lastLoginDate: typeof parsed.lastLoginDate === 'string' ? parsed.lastLoginDate : localDateStr(),
    vow: isRecord(parsed.vow) ? { ...defaultVow(), ...parsed.vow } : defaultVow(),
  } as AppData;
}

function createInitialData(): AppData {
  return {
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
    vow: defaultVow(),
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const initial = createInitialData();
      saveAppData(initial);
      return initial;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      const fallback = createInitialData();
      saveAppData(fallback);
      return fallback;
    }

    return normalizeData(parsed as unknown as AppData);
  } catch {
    const fallback = createInitialData();
    saveAppData(fallback);
    return fallback;
  }
}

export function saveAppData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be unavailable or full.
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
    const parsed: unknown = JSON.parse(jsonString);

    if (
      !isRecord(parsed) ||
      !isRecord(parsed.player) ||
      !Array.isArray(parsed.quests)
    ) {
      return null;
    }

    const normalized = normalizeData(parsed as unknown as AppData);
    saveAppData(normalized);
    return normalized;
  } catch {
    return null;
  }
}
