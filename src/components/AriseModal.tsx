import React, { useEffect } from 'react';
import { sound } from '../utils/sound';
import { Ghost, Sparkles, X } from 'lucide-react';

interface Props {
  shadowName: string;
  subjectName: string;
  grade: string;
  power: number;
  soundEnabled: boolean;
  onClose: () => void;
}

export const AriseModal: React.FC<Props> = ({ shadowName, subjectName, grade, power, soundEnabled, onClose }) => {
  useEffect(() => {
    sound.playArise(soundEnabled);
  }, [soundEnabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-purple-950 via-slate-950 to-black border-2 border-purple-500 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.5)] text-center animate-scaleUp">
        {/* Glow Effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-900/50 border-2 border-purple-400 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-bounce">
            <Ghost className="w-10 h-10 text-purple-300" />
          </div>

          <div className="text-xs font-mono tracking-widest text-purple-400 mb-2">[ SHADOW EXTRACTION SUCCESSFUL ]</div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-violet-300 to-cyan-300 font-mono tracking-wider mb-2">
            ARISE
          </h2>
          <p className="text-purple-300 font-mono text-sm mb-6">A new shadow has bowed to your command from {subjectName}.</p>

          <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-4 mb-6 text-left space-y-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-purple-400 text-xs">SHADOW NAME:</span>
              <span className="text-white font-bold">{shadowName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400 text-xs">GRADE:</span>
              <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40">{grade}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400 text-xs">POWER LEVEL:</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {power}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-sm uppercase tracking-wider py-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all cursor-pointer"
          >
            Add to Shadow Army
          </button>
        </div>
      </div>
    </div>
  );
};
