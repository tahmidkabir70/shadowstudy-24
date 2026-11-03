import { AppData, Rank, ShadowGrade } from '../types';
import { sound } from './sound';

export function calculateXpForNextLevel(level: number): number {
  return 200 * level;
}

export function calculateRank(level: number): Rank {
  if (level >= 75) return 'S';
  if (level >= 50) return 'A';
  if (level >= 35) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

// Shadow grade and power grow with every revision of its chapter.
export function gradeForRevisions(count: number): ShadowGrade {
  if (count >= 12) return 'Marshal';
  if (count >= 9) return 'Elite Knight';
  if (count >= 6) return 'Knight';
  if (count >= 4) return 'Elite';
  return 'Soldier';
}

export function powerForRevisions(count: number): number {
  return 100 + count * 25;
}

export const INTERVAL_STAGES = [1, 3, 7, 14, 30, 60];

export function getNextRevisionDays(currentStage: number, rating: 'hard' | 'good' | 'easy'): { nextStage: number; days: number } {
  let stage = currentStage;
  if (rating === 'hard') {
    stage = Math.max(0, stage - 1);
  } else if (rating === 'good') {
    stage = Math.min(INTERVAL_STAGES.length - 1, stage + 1);
  } else if (rating === 'easy') {
    stage = Math.min(INTERVAL_STAGES.length - 1, stage + 2);
  }
  const days = INTERVAL_STAGES[stage] || 1;
  return { nextStage: stage, days };
}

export function addXpAndGold(
  data: AppData,
  xp: number,
  gold: number,
  callback?: (msg: string) => void
): { data: AppData; leveledUp: boolean; oldLevel: number; newLevel: number } {
  let { xp: currentXp, level, gold: currentGold, growthPoints } = data.player;
  const oldLevel = level;
  let finalXp = xp;
  if (data.player.activePassives.includes('Hyper Focus') && xp >= 25) {
    finalXp = Math.round(xp * 1.2);
  }
  currentXp += finalXp;
  currentGold += gold;
  let reqXp = calculateXpForNextLevel(level);
  let leveledUp = false;
  while (currentXp >= reqXp) {
    currentXp -= reqXp;
    level += 1;
    growthPoints += 1;
    leveledUp = true;
    reqXp = calculateXpForNextLevel(level);
  }
  const newRank = calculateRank(level);
  if (leveledUp) {
    sound.playLevelUp(data.settings.soundEnabled);
    if (callback) callback(`LEVEL UP! Reached Level ${level} (Rank ${newRank}). +1 Growth Point`);
  } else {
    sound.playSuccess(data.settings.soundEnabled);
    if (callback) callback(`Gained +${finalXp} XP and +${gold} Credits`);
  }
  const unlockedTitles = [...data.player.unlockedTitles];
  let title = data.player.title;
  if (level >= 10 && !unlockedTitles.includes('Rising Shadow')) {
    unlockedTitles.push('Rising Shadow');
    title = 'Rising Shadow';
  }
  if (level >= 25 && !unlockedTitles.includes('Shadow Adept')) {
    unlockedTitles.push('Shadow Adept');
    title = 'Shadow Adept';
  }
  if (level >= 50 && !unlockedTitles.includes("Monarch's Candidate")) {
    unlockedTitles.push("Monarch's Candidate");
    title = "Monarch's Candidate";
  }
  const updatedData: AppData = {
    ...data,
    player: {
      ...data.player,
      level,
      xp: currentXp,
      rank: newRank,
      gold: currentGold,
      growthPoints,
      title,
      unlockedTitles,
    },
  };
  return { data: updatedData, leveledUp, oldLevel, newLevel: level };
}
