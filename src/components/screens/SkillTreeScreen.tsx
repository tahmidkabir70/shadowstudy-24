import React from 'react';
import { AppData } from '../../types';
import { CheckCircle } from 'lucide-react';

interface Props {
  data: AppData;
  onUnlockSkill: (skillId: string) => void;
}

export const SkillTreeScreen: React.FC<Props> = ({ data, onUnlockSkill }) => {
  const { player, skills } = data;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest">[ MONARCH ABILITIES ]</div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">Skill Tree</h1>
        </div>
        <div className="bg-cyan-950/80 border border-cyan-500/30 rounded-xl px-4 py-2 font-mono text-xs text-cyan-300">
          Growth Points: <span className="text-white font-bold">{player.growthPoints}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className={`bg-slate-900/90 border-2 rounded-2xl p-6 ${skill.unlocked ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">{skill.category}</span>
              <span className="text-xs font-mono text-yellow-400">{skill.costPoints} Points</span>
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-1">{skill.name}</h3>
            <p className="text-xs font-mono text-cyan-400/80 mb-4">{skill.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400">{skill.bonusText}</span>
              {skill.unlocked ? (
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Unlocked</span>
              ) : (
                <button
                  onClick={() => onUnlockSkill(skill.id)}
                  disabled={player.growthPoints < skill.costPoints}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                    player.growthPoints >= skill.costPoints ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Unlock Skill
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
