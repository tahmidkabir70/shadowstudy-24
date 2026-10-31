import { AppData, AppSettings, Gate, NoteItem, PlannerItem, Player, Quest, RewardItem, SeasonData, ShopItem, SkillItem, Subject } from '../types';

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
  lastActiveDate: new Date().toISOString().split('T')[0],
  resilienceUsedThisWeek: false,
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
  { id: 'rw1', title: 'Watch favorite movie / series episode', unlocked: false, costGold: 100 },
  { id: 'rw2', title: 'Enjoy favorite snack or treat', unlocked: false, costGold: 60 },
  { id: 'rw3', title: '1 hour gaming break guilt-free', unlocked: false, costGold: 150 },
];

const defaultSeason: SeasonData = {
  currentWeek: 1,
  seasonName: 'Season I: Awakening of the Shadow',
  active: true,
  bossDefeated: false,
};

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
        season: defaultSeason,
        sessions: [],
        settings: defaultSettings,
        lastLoginDate: new Date().toISOString().split('T')[0],
      };
      saveAppData(initial);
      return initial;
    }
    const parsed: AppData = JSON.parse(raw);
    return { ...parsed, settings: { ...defaultSettings, ...(parsed.settings || {}) } };
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
      season: defaultSeason,
      sessions: [],
      settings: defaultSettings,
      lastLoginDate: new Date().toISOString().split('T')[0],
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
  downloadAnchor.setAttribute('download', `shadow_study_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBackup(jsonString: string): AppData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.player && parsed.quests) {
      saveAppData(parsed);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
