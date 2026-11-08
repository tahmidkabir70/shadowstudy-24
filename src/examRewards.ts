import type { Rank, ShadowGrade } from '../types';

export type ExamReward =
  | {
      type: 'points';
      xp: number;
      gold: number;
    }
  | {
      type: 'member';
      rank: Rank;
      name: string;
      grade: ShadowGrade;
      power: number;
    };

const ARMY_POOLS: Record<Rank, string[]> = {
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
}[] = [
  { rank: 'E', chance: 25 },
  { rank: 'D', chance: 13 },
  { rank: 'C', chance: 7 },
  { rank: 'B', chance: 3 },
  { rank: 'A', chance: 1 },
  { rank: 'S', chance: 1 },
];

const RANK_DETAILS: Record<
  Rank,
  { grade: ShadowGrade; power: number }
> = {
  E: { grade: 'Soldier', power: 80 },
  D: { grade: 'Elite', power: 130 },
  C: { grade: 'Knight', power: 210 },
  B: { grade: 'Elite Knight', power: 320 },
  A: { grade: 'Marshal', power: 480 },
  S: { grade: 'Marshal', power: 650 },
};

export function rollExamReward(): ExamReward {
  const roll = Math.random() * 100;

  // 50% chance: points only
  if (roll >= 50) {
    return {
      type: 'points',
      xp: 40,
      gold: 20,
    };
  }

  let cumulativeChance = 0;

  for (const reward of RANK_REWARDS) {
    cumulativeChance += reward.chance;

    if (roll < cumulativeChance) {
      const pool = ARMY_POOLS[reward.rank];
      const randomIndex = Math.floor(Math.random() * pool.length);
      const details = RANK_DETAILS[reward.rank];

      return {
        type: 'member',
        rank: reward.rank,
        name: pool[randomIndex],
        grade: details.grade,
        power: details.power,
      };
    }
  }

  return {
    type: 'points',
    xp: 40,
    gold: 20,
  };
}

export function getDuplicateReward() {
  return {
    xp: 60,
    gold: 30,
  };
}