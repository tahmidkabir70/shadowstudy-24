import { AppData, Rank } from '../types';
import { sound } from './sound';

export function calculateXpForNextLevel(level: number): number {
  return 100 + (level - 1) * 25;
}

export function calculateRank(level: number): Rank {
  if (level >= 75) return 'S';
  if (level >= 50) return 'A';
  if (level >= 35) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

export function attributeGrade(val: number): string {
  if (val >= 150) return 'S';
  if (val >= 120) return 'A';
  if (val >= 90) return 'B';
  if (val >= 70) return 'C';
  if (val >= 50) return 'D';
  if (val >= 30) return 'E';
  return 'F';
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
): AppData {
  let { xp: currentXp, level, gold: currentGold, growthPoints } = data.player;
  
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

  return {
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
}
