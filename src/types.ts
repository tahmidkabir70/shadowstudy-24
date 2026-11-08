export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type JobPath = 'Scholar' | 'Strategist' | 'Endurer' | 'None';

export interface Attributes {
  knowledge: number;
  focus: number;
  discipline: number;
  memory: number;
  planning: number;
  consistency: number;
  creativity: number;
  vitality: number;
}

export interface Player {
  name: string;
  level: number;
  xp: number;
  rank: Rank;
  title: string;
  path: JobPath;
  gold: number;
  growthPoints: number;
  attributes: Attributes;
  attributeGrades: Record < keyof Attributes,
  string > ;
  dailyGoalMinutes: number;
  todayStudyMinutes: number;
  todayRevisionsDone: number;
  totalRevisionsDue: number;
  fatigueMinutes: number;
  streak: number;
  lastActiveDate: string;
  lastStudyDate: string;
  resilienceUsedThisWeek: boolean;
  resilienceUsedDate: string;
  focusPotionActive: boolean;
  revisionScrollActive: boolean;
  activePassives: string[];
  unlockedSkills: string[];
  unlockedTitles: string[];
  completedDailySet: boolean;
  lastStatusPopupDate: string;
  questsCompletedTotal ? : number;
}

export type QuestType = |
  'daily' |
  'main' |
  'side' |
  'hidden' |
  'comeback' |
  'instant' |
  'weekly_boss';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  xpReward: number;
  goldReward: number;
  completed: boolean;
  completedDate ? : string;
  chainId ? : string;
  targetMinutes ? : number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  learned: boolean;
  learnedDate ? : string;
  revisionCount: number;
  nextRevisionDate ? : string;
  lastRevisionDate ? : string;
  intervalStage: number;
  extractedToShadow: boolean;
  examCompleted ? : boolean;
  examAriseClaimed ? : boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  chapters: Chapter[];
  examChapters ? : Chapter[];
}

export type ShadowGrade = |
  'Soldier' |
  'Elite' |
  'Knight' |
  'Elite Knight' |
  'Marshal';

export interface Shadow {
  id: string;
  chapterId: string;
  name: string;
  customNickname ? : string;
  subjectName: string;
  grade: ShadowGrade;
  power: number;
  lastRevisedDate: string;
  isDormant: boolean;
  extractedDate: string;
  rank ? : Rank;
}

export type GateRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface GateStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Gate {
  id: string;
  title: string;
  description: string;
  rank: GateRank;
  steps: GateStep[];
  bossTask: string;
  bossCompleted: boolean;
  rewardXp: number;
  rewardGold: number;
  deadline ? : string;
  cleared: boolean;
  clearedDate ? : string;
}

export interface PlannerItem {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  time: string;
  subject: string;
  task: string;
  completed: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  subject: string;
  pinned: boolean;
  updatedAt: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'potion' | 'scroll' | 'shield' | 'chest';
  icon: string;
  quantity: number;
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'Focus' | 'Discipline' | 'Knowledge' | 'Time Management';
  description: string;
  costPoints: number;
  unlocked: boolean;
  bonusText: string;
}

export interface RewardItem {
  id: string;
  title: string;
  category: string;
  unlocked: boolean;
  unlockedAt ? : number;
  costGold: number;
}

export interface Expedition {
  id: string;
  shadowId: string;
  shadowName: string;
  destination: string;
  durationMinutes: number;
  startTime: number;
  rewardXp: number;
  rewardGold: number;
  completed: boolean;
}

export type AchievementTier = |
  'Bronze' |
  'Silver' |
  'Gold' |
  'Platinum' |
  'Diamond' |
  'Monarch';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category:
    |
    'Study Time' |
    'Discipline' |
    'Level' |
    'Army' |
    'Gates' |
    'Knowledge' |
    'Quests';
  tier: AchievementTier;
  targetValue: number;
  unlocked: boolean;
  claimed: boolean;
  rewardGold: number;
  rewardGrowthPoints ? : number;
}

export interface DailyEvaluation {
  date: string;
  rank: Rank;
  studyMinutes: number;
  completedQuests: number;
  summary: string;
}

export interface SeasonData {
  currentWeek: number;
  seasonName: string;
  active: boolean;
  bossDefeated: boolean;
  startDate ? : string;
}

export interface StudySessionLog {
  id: string;
  date: string;
  durationMinutes: number;
  subject: string;
  xpEarned: number;
}

export interface AppSettings {
  language: 'en' | 'bn';
  theme: 'dark' | 'light' | 'auto';
  calmSkin: boolean;
  animationLevel: 'full' | 'reduced' | 'off';
  statusWindowFrequency: 'always' | 'daily' | 'never';
  soundEnabled: boolean;
}

export interface VowStreak {
  id: string;
  name: string;
  startDate: string;
  bestStreak: number;
  relapses: number;
  claimedMilestones: number[];
}

export interface VowData {
  privateMode: boolean;
  vows: VowStreak[];
}

export interface AppData {
  player: Player;
  quests: Quest[];
  subjects: Subject[];
  shadows: Shadow[];
  gates: Gate[];
  planner: PlannerItem[];
  notes: NoteItem[];
  shop: ShopItem[];
  skills: SkillItem[];
  rewards: RewardItem[];
  expeditions: Expedition[];
  achievements: Achievement[];
  evaluations: DailyEvaluation[];
  season: SeasonData;
  sessions: StudySessionLog[];
  settings: AppSettings;
  lastLoginDate: string;
  vow ? : VowData;
}