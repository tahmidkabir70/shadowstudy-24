
import React, { useState } from 'react';
import { Ghost, Sparkles, Lock, CheckCircle } from 'lucide-react';

interface Props {
  shadowId: string;
  shadowName: string;
  subjectName: string;
  grade: string;
  power: number;
  soundEnabled?: boolean;
  onConfirm: (shadowId: string, nickname: string) => void;
  onClose: () => void;
}

export const AriseModal: React.FC<Props> = ({
  shadowId,
  shadowName,
  subjectName,
  grade,
  power,
  onConfirm,
  onClose,
}) => {
  const [nickname, setNickname] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    const cleanName = nickname.trim();

    if (!cleanName || confirmed) return;

    setConfirmed(true);
    onConfirm(shadowId, cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <div className="relative w-full max-w-md bg-gradient-to-b from-[#12081c] via-[#0a0610] to-black border border-purple-500/60 rounded-sm p-7 shadow-[0_0_60px_rgba(168,85,247,0.4)] text-center animate-scaleUp overflow-hidden">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400" />

        <div className="absolute -inset-8 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-purple-950/60 border border-purple-400/50 shadow-[0_0_40px_rgba(168,85,247,0.6)]">
            <Ghost className="w-9 h-9 text-purple-300" />
          </div>

          <div>
            <div className="text-[11px] font-mono tracking-[0.2em] text-purple-400 mb-2">
              [ SHADOW EXTRACTION COMPLETE ]
            </div>

            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-violet-300 to-cyan-200 font-mono tracking-widest">
              ARISE
            </h2>

            <p className="text-purple-300/80 font-mono text-xs mt-3">
              A new shadow has answered from{' '}
              <span className="text-purple-200">{subjectName}</span>
            </p>
          </div>

          <div className="bg-black/50 border border-purple-500/30 rounded-sm p-4 text-left space-y-3 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-purple-400/80 text-[10px] tracking-wider">
                ORIGINAL NAME
              </span>
              <span className="text-white font-bold text-sm">
                {shadowName}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-purple-400/80 text-[10px] tracking-wider">
                GRADE
              </span>
              <span className="text-purple-200 font-bold text-xs px-2 py-0.5 rounded-sm bg-purple-900/50 border border-purple-500/40">
                {grade}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-purple-400/80 text-[10px] tracking-wider">
                POWER
              </span>
              <span className="text-cyan-300 font-bold text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {power}
              </span>
            </div>
          </div>

          <div className="text-left space-y-2">
            <label className="block text-[11px] font-mono tracking-widest text-purple-300">
              ASSIGN A PERMANENT NAME
            </label>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your Shadow's name..."
              maxLength={20}
              autoComplete="off"
              className="w-full bg-black/70 border border-purple-500/50 rounded-sm px-4 py-3 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            />

            <div className="flex items-center gap-2 text-[10px] text-yellow-400/80 font-mono">
              <Lock className="w-3.5 h-3.5" />
              THIS NAME CANNOT BE CHANGED AFTER CONFIRMATION
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!nickname.trim() || confirmed}
            className="w-full sl-btn sl-btn-purple py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            CONFIRM NAME & ADD TO ARMY
          </button>
        </div>
      </div>
    </div>
  );
};
