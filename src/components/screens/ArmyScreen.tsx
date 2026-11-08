
import React, { useEffect, useState } from 'react';
import { AppData, Shadow } from '../../types';
import {
  Sparkles,
  AlertTriangle,
  Send,
  CheckCircle,
  Lock,
} from 'lucide-react';

interface Props {
  data: AppData;
  onUpdateNickname: (shadowId: string, nickname: string) => void;
  onStartExpedition: (shadow: Shadow) => void;
  onClaimExpedition: (expId: string) => void;
}

export const ArmyScreen: React.FC<Props> = ({
  data,
  onUpdateNickname,
  onStartExpedition,
  onClaimExpedition,
}) => {
  const { shadows, expeditions } = data;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const totalPower = shadows.reduce(
    (acc, shadow) =>
      acc + (shadow.isDormant ? Math.round(shadow.power / 2) : shadow.power),
    0
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-black border-2 border-purple-500/50 rounded-2xl p-6 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-purple-400 tracking-widest">
              [ SHADOW MONARCH DOMAIN ]
            </div>

            <h1 className="text-2xl font-bold font-mono text-white mt-1">
              Shadow Army Legions & Expeditions
            </h1>

            <p className="text-xs font-mono text-purple-300 mt-0.5">
              Dispatch loyal soldiers on study expeditions to harvest Gold and
              XP.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/40 rounded-xl px-6 py-3 text-center">
            <div className="text-[10px] font-mono text-purple-400">
              TOTAL ARMY POWER
            </div>

            <div className="text-2xl font-bold font-mono text-cyan-300 flex items-center justify-center gap-1">
              <Sparkles className="w-5 h-5 text-purple-400" /> {totalPower} PW
            </div>
          </div>
        </div>
      </div>

      {expeditions.length > 0 && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-sm font-mono text-purple-400 tracking-wider">
            ACTIVE EXPEDITIONS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expeditions.map((exp) => {
              const elapsedMins = Math.floor(
                (now - exp.startTime) / 60000
              );
              const remainingMins = Math.max(
                0,
                exp.durationMinutes - elapsedMins
              );
              const isReady = remainingMins <= 0;

              return (
                <div
                  key={exp.id}
                  className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between font-mono"
                >
                  <div>
                    <div className="text-xs text-purple-300 font-bold">
                      {exp.shadowName}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Destination: {exp.destination}
                    </div>

                    <div className="text-[10px] text-cyan-300 mt-1">
                      {isReady
                        ? 'Mission Complete!'
                        : `Time Remaining: ${remainingMins} mins`}
                    </div>
                  </div>

                  {isReady ? (
                    <button
                      onClick={() => onClaimExpedition(exp.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1 shadow cursor-pointer animate-pulse"
                    >
                      <CheckCircle className="w-4 h-4" /> Claim (+
                      {exp.rewardGold}G)
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg">
                      Expedition...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shadows.map((shadow) => {
          const isOnExpedition = expeditions.some(
            (exp) => exp.shadowId === shadow.id
          );

          // পুরোনো Save Data-তে Nickname থাকলেও সেটি Locked থাকবে।
          const hasNickname = Boolean(shadow.customNickname?.trim());
          const isNicknameLocked =
            Boolean(shadow.customNicknameLocked) || hasNickname;

          const displayName = hasNickname
            ? shadow.customNickname!.trim()
            : shadow.name;

          return (
            <div
              key={shadow.id}
              className={`bg-slate-900/90 border-2 rounded-2xl p-6 shadow-lg transition-all ${
                shadow.isDormant
                  ? 'border-yellow-500/40 opacity-75'
                  : 'border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/40 uppercase">
                  {shadow.rank ? `${shadow.rank}-RANK` : shadow.grade}
                </span>

                <span className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />{' '}
                  {shadow.isDormant
                    ? Math.round(shadow.power / 2)
                    : shadow.power}{' '}
                  PW
                </span>
              </div>

              <div className="mb-4">
                <div className="text-xs font-mono text-purple-400 mb-1">
                  {shadow.subjectName}
                </div>

                <h3 className="text-lg font-bold font-mono text-white mb-2">
                  {displayName}
                </h3>

                {shadow.isDormant && (
                  <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-mono bg-yellow-950/40 p-2 rounded-lg border border-yellow-500/30 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Dormant (Needs
                    Revision)
                  </div>
                )}
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-purple-400 block mb-1">
                    Shadow Nickname
                  </label>

                  {isNicknameLocked ? (
                    <div className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-purple-200 flex items-center justify-between gap-2">
                      <span className="truncate">{displayName}</span>
                      <span className="flex items-center gap-1 text-[10px] text-purple-400 shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                        LOCKED
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      defaultValue={shadow.name}
                      onBlur={(e) => {
                        const nickname = e.target.value.trim();

                        if (nickname && nickname !== shadow.name) {
                          onUpdateNickname(shadow.id, nickname);
                        }
                      }}
                      placeholder="Enter Shadow Nickname"
                      className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  )}
                </div>

                <button
                  onClick={() =>
                    !isOnExpedition && onStartExpedition(shadow)
                  }
                  disabled={isOnExpedition}
                  className={`w-full py-2.5 rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isOnExpedition
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />{' '}
                  {isOnExpedition
                    ? 'On Expedition'
                    : 'Dispatch on Expedition (60m)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
