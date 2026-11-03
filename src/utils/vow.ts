import { VowData, VowStreak } from '../types';
import { daysBetween } from './date';

// Streak milestones (in days) and what each one pays out.
export const VOW_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

export const VOW_REWARDS: Record<number, { xp: number; gold: number; gp: number }> = {
  1: { xp: 20, gold: 10, gp: 0 },
  3: { xp: 40, gold: 20, gp: 0 },
  7: { xp: 100, gold: 50, gp: 1 },
  14: { xp: 200, gold: 100, gp: 1 },
  30: { xp: 500, gold: 250, gp: 2 },
  60: { xp: 800, gold: 400, gp: 2 },
  90: { xp: 1200, gold: 600, gp: 3 },
  180: { xp: 2000, gold: 1000, gp: 4 },
  365: { xp: 5000, gold: 2500, gp: 5 },
};

export function defaultVow(): VowData {
  return {
    privateMode: false,
    vows: [
      { id: 'vow_porn', name: 'No Porn', startDate: '', bestStreak: 0, relapses: 0, claimedMilestones: [] },
      { id: 'vow_mast', name: 'No Masturbation', startDate: '', bestStreak: 0, relapses: 0, claimedMilestones: [] },
    ],
  };
}

// Full days since the streak started. 0 if the vow has not begun.
export function vowStreakDays(v: VowStreak, today: string): number {
  if (!v.startDate) return 0;
  return Math.max(0, daysBetween(v.startDate, today));
}
