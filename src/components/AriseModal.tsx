import React from 'react';
import { Ghost, Sparkles } from 'lucide-react';

interface Props {
  shadowName: string;
  subjectName: string;
  grade: string;
  power: number;
  onClose: () => void;
}

export const AriseModal: React.FC < Props > = ({ shadowName, subjectName, grade, power, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gradient-to-b from-[#12081c] via-[#0a0610] to-black border border-purple-500/60 rounded-sm p-7 shadow-[0_0_60px_rgba(168,85,247,0.4)] text-center animate-scaleUp overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400" />

        {/* Glow orb */}
        <div className="absolute -inset-8 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-purple-950/60 border border-purple-400/50 mb-5 shadow-[0_0_40px_rgba(168,85,247,0.6)]">
            <Ghost className="w-9 h-9 text-purple-300" />
          </div>

          <div className="text-[11px] font-mono tracking-[0.2em] text-purple-400 mb-2">
            [ SHADOW EXTRACTION COMPLETE ]
          </div>
          
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-violet-300 to-cyan-200 font-mono tracking-widest mb-2">
            ARISE
          </h2>
          
          <p className="text-purple-300/80 font-mono text-xs mb-6">
            A new shadow has answered from <span className="text-purple-200">{subjectName}</span>
          </p>

          <div className="bg-black/50 border border-purple-500/30 rounded-sm p-4 mb-6 text-left space-y-2.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-purple-400/80 text-[10px] tracking-wider">SHADOW NAME</span>
              <span className="text-white font-bold text-sm">{shadowName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400/80 text-[10px] tracking-wider">GRADE</span>
              <span className="text-purple-200 font-bold text-xs px-2 py-0.5 rounded-sm bg-purple-900/50 border border-purple-500/40">
                {grade}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400/80 text-[10px] tracking-wider">POWER</span>
              <span className="text-cyan-300 font-bold text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {power}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full sl-btn sl-btn-purple py-3.5"
          >
            ADD TO SHADOW ARMY
          </button>
        </div>
      </div>
    </div>
  );
};