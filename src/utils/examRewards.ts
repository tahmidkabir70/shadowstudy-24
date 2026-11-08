
import { Rank, ShadowGrade } from '../types';

export type ExamReward =
  | {
      type: 'points';
      xp: number;
      gold: number;
    }
  | {
      type: 'shadow';
      name: string;
      rank: Rank;
      grade: ShadowGrade;
      power: number;
    };

const ARMY_POOL: Record<Rank, string[]> = {
  E: ['Soldier 01', 'Soldier 02', 'Soldier 03'],
  D: ['Soldier 04', 'Soldier 05'],
  C: ['Soldier 06', 'Soldier 07'],
  B: ['Soldier 08'],
  A: ['Soldier 09'],
  S: ['Soldier 10'],
};

const RANK_REWARDS: {
  rank: Rank;
  chance: number;
  grade: ShadowGrade;
  power: number;
}[] = [
  { rank: 'E', chance: 25, grade: 'Soldier', power: 80 },
  { rank: 'D', chance: 13, grade: 'Elite', power: 130 },
  { rank: 'C', chance: 7, grade: 'Knight', power: 210 },
  { rank: 'B', chance: 3, grade: 'Elite Knight', power: 320 },
  { rank: 'A', chance: 1, grade: 'Marshal', power: 480 },
  { rank: 'S', chance: 1, grade: 'Marshal', power: 650 },
];

export function rollExamReward(): ExamReward {
  const roll = Math.random() * 100;

  // 50% chance: points only.
  if (roll < 50) {
    return {
      type: 'points',
      xp: 40,
      gold: 20,
    };
  }

  // Remaining 50%: Army Member summon.
  const rankRoll = roll - 50;
  let cumulativeChance = 0;

  for (const reward of RANK_REWARDS) {
    cumulativeChance += reward.chance;

    if (rankRoll < cumulativeChance) {
      const pool = ARMY_POOL[reward.rank];
      const name = pool[Math.floor(Math.random() * pool.length)];

      return {
        type: 'shadow',
        name,
        rank: reward.rank,
        grade: reward.grade,
        power: reward.power,
      };
    }
  }

  // Safety fallback.
  return {
    type: 'shadow',
    name: ARMY_POOL.E[0],
    rank: 'E',
    grade: 'Soldier',
    power: 80,
  };
}

export function getDuplicateReward(): {
  xp: number;
  gold: number;
} {
  return {
    xp: 60,
    gold: 30,
  };
}
