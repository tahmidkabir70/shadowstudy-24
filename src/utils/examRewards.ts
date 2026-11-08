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

const ARMY_POOL: Record<Exclude<Rank, 'S'>, string[]> = {
  E: ['Soldier 01', 'Soldier 02', 'Soldier 03'],
  D: ['Soldier 04', 'Soldier 05'],
  C: ['Soldier 06', 'Soldier 07'],
  B: ['Soldier 08'],
  A: ['Soldier 09'],
};

const NORMAL_RANK_REWARDS: {
  rank: Exclude<Rank, 'S'>;
  chance: number;
  grade: ShadowGrade;
  power: number;
}[] = [
  { rank: 'E', chance: 45, grade: 'Soldier', power: 80 },
  { rank: 'D', chance: 30, grade: 'Elite', power: 130 },
  { rank: 'C', chance: 15, grade: 'Knight', power: 210 },
  { rank: 'B', chance: 8, grade: 'Elite Knight', power: 320 },
  { rank: 'A', chance: 2, grade: 'Marshal', power: 480 },
];

const LOW_LUCK_RANK_REWARDS: {
  rank: 'E' | 'D';
  chance: number;
  grade: ShadowGrade;
  power: number;
}[] = [
  { rank: 'E', chance: 70, grade: 'Soldier', power: 80 },
  { rank: 'D', chance: 30, grade: 'Elite', power: 130 },
];

function rollShadow(
  lowLuckActive: boolean
): Extract<ExamReward, { type: 'shadow' }> {
  const rewards = lowLuckActive
    ? LOW_LUCK_RANK_REWARDS
    : NORMAL_RANK_REWARDS;

  const roll = Math.random() * 100;
  let cumulativeChance = 0;

  for (const reward of rewards) {
    cumulativeChance += reward.chance;

    if (roll < cumulativeChance) {
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

  return {
    type: 'shadow',
    name: ARMY_POOL.E[0],
    rank: 'E',
    grade: 'Soldier',
    power: 80,
  };
}

/**
 * Each Exam Time reward claim has a 5% Shadow extraction chance.
 * The rank lottery runs only when extraction succeeds.
 * S Rank is never included.
 */
export function rollExamReward(
  lowLuckActive: boolean = false
): ExamReward {
  const extractionRoll = Math.random() * 100;

  if (extractionRoll >= 5) {
    return {
      type: 'points',
      xp: 40,
      gold: 20,
    };
  }

  return rollShadow(lowLuckActive);
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