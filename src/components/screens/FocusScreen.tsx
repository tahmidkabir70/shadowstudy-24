
import React, { useEffect, useState } from 'react';
import { AppData } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Clock3,
  Target,
  Zap,
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface Props {
  data: AppData;
  onFinishSession: (minutes: number, subject: string) => void;
}

const TIMER_STORAGE_KEY = 'SHADOW_STUDY_TIMER_STATE';

interface SavedTimer {
  endTimestamp?: number;
  durationMins?: number;
  selectedSubject?: string;
}

function readSavedTimer(): SavedTimer | null {
  try {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.endTimestamp !== 'number' ||
      typeof parsed.durationMins !== 'number'
    ) {
      return null;
    }

    return parsed as SavedTimer;
  } catch {
    return null;
  }
}

const initialTimer = readSavedTimer();

export const FocusScreen: React.FC<Props> = ({ data, onFinishSession }) => {
  const [durationMins, setDurationMins] = useState<number>(() => {
    return initialTimer?.durationMins || 25;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (initialTimer?.endTimestamp) {
      return Math.max(
        0,
        Math.round((initialTimer.endTimestamp - Date.now()) / 1000)
      );
    }

    return 25 * 60;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    return Boolean(initialTimer?.endTimestamp);
  });

  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return initialTimer?.selectedSubject || data.subjects[0]?.name || 'General';
  });

  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<
    'silence' | 'dungeon' | 'cyberpunk' | 'rain'
  >('silence');

  // Persist the running timer.
  useEffect(() => {
    try {
      if (isRunning) {
        const endTimestamp = Date.now() + timeLeft * 1000;

        localStorage.setItem(
          TIMER_STORAGE_KEY,
          JSON.stringify({
            endTimestamp,
            durationMins,
            selectedSubject,
          })
        );
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch {
      // Storage may be unavailable.
    }
  }, [isRunning, timeLeft, durationMins, selectedSubject]);

  // Complete the focus session.
  useEffect(() => {
    if (!isRunning || timeLeft > 0) return;

    setIsRunning(false);
    setIsBreak(true);
    setTimeLeft(5 * 60);

    sound.playSuccess(data.settings.soundEnabled);
    onFinishSession(durationMins, selectedSubject);
  }, [
    isRunning,
    timeLeft,
    durationMins,
    selectedSubject,
    onFinishSession,
    data.settings.soundEnabled,
  ]);

  // Normal countdown.
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const setTimerPreset = (mins: number) => {
    setIsRunning(false);
    setIsBreak(false);
    setDurationMins(mins);
    setTimeLeft(mins * 60);

    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((isBreak ? 300 : durationMins * 60 - timeLeft) /
          (isBreak ? 300 : durationMins * 60)) *
          100
      )
    )
  );

  const presets = [15, 25, 45, 60];

  const atmospheres = [
    { id: 'silence', label: 'Silence' },
    { id: 'dungeon', label: 'Dungeon' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'rain', label: 'Rain' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn pb-12 px-1">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#07111d] p-5 sm:p-6">
        <div className="absolute -top-20 -right-16 w-56 h-56 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-cyan-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              Shadow System / Focus Gate
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-wide">
              {isBreak ? 'RECOVERY MODE' : 'FOCUS MODE'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {isBreak
                ? 'Your focus session is complete. Take a short rest.'
                : 'Enter the gate. Focus your mind. Earn your rewards.'}
            </p>
          </div>

          <div className="hidden sm:flex w-14 h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 items-center justify-center">
            <Zap className="w-7 h-7 text-cyan-300" />
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl bg-black/30 border border-white/5 p-3">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Session
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {isBreak ? 'Rest Period' : `${durationMins} Minutes`}
            </div>
          </div>

          <div className="rounded-xl bg-black/30 border border-white/5 p-3">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              System Status
            </div>
            <div className="flex items-center gap-2 text-sm font-bold mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-green-400 shadow-[0_0_8px_#4ade80]'
                    : 'bg-amber-400'
                }`}
              />
              <span className={isRunning ? 'text-green-400' : 'text-amber-400'}>
                {isRunning ? 'Running' : 'Standby'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TIMER */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0b1928] to-[#050a12] px-4 py-8 sm:py-10">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-400/10 blur-[80px] pointer-events-none" />

        <div className="relative text-center">
          <div className="text-[10px] sm:text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase mb-7">
            {isBreak ? 'Recovery Countdown' : 'Time Remaining'}
          </div>

          {/* CIRCULAR TIMER */}
          <div
            className="relative mx-auto w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] rounded-full p-[8px]"
            style={{
              background: `conic-gradient(from -90deg, #22d3ee ${
                progressPercent * 3.6
              }deg, rgba(30, 64, 80, 0.35) ${
                progressPercent * 3.6
              }deg 360deg)`,
              boxShadow: '0 0 35px rgba(34,211,238,0.12)',
            }}
          >
            <div className="w-full h-full rounded-full bg-[#06101b] border border-cyan-400/10 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-5 rounded-full border border-cyan-400/10" />

              <div className="relative text-[10px] tracking-[0.25em] font-mono text-cyan-500/80 uppercase mb-3">
                {isRunning ? 'Concentrating' : 'Ready'}
              </div>

              <div className="relative text-[52px] sm:text-[64px] font-black font-mono tracking-tight text-white tabular-nums drop-shadow-[0_0_18px_rgba(34,211,238,0.35)]">
                {formatTime(timeLeft)}
              </div>

              <div className="relative mt-3 text-[10px] font-mono text-slate-500 tracking-widest">
                {progressPercent}% COMPLETED
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-7 font-mono">
            {isRunning
              ? 'Stay focused. Your progress is being recorded.'
              : 'Every focused minute brings you closer to your goal.'}
          </p>
        </div>

        {/* PRESETS */}
        {!isBreak && (
          <div className="relative mt-9">
            <div className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase text-center mb-3">
              Select Duration
            </div>

            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {presets.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTimerPreset(mins)}
                  disabled={isRunning}
                  className={`rounded-xl py-3 text-xs sm:text-sm font-mono font-bold border transition-all ${
                    durationMins === mins
                      ? 'bg-cyan-400 text-[#04111d] border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.25)]'
                      : 'bg-[#091522] text-slate-400 border-white/10 hover:border-cyan-400/50 hover:text-cyan-300'
                  } ${
                    isRunning
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {mins} MIN
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="relative flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 max-w-[220px] py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black tracking-wider transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-cyan-400 hover:bg-cyan-300 text-[#04111d] shadow-[0_0_25px_rgba(34,211,238,0.25)]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                PAUSE
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {isBreak ? 'PAUSE BREAK' : 'START FOCUS'}
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durationMins * 60);
              setIsBreak(false);

              try {
                localStorage.removeItem(TIMER_STORAGE_KEY);
              } catch {
                // ignore
              }
            }}
            className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#101d2a] border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SESSION SETTINGS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* SUBJECT */}
        <div className="rounded-2xl border border-cyan-500/15 bg-[#08121e] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wider uppercase">
              Target Subject
            </h2>
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isRunning || isBreak}
            className="w-full bg-[#030912] border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
          >
            {data.subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}

            <option value="General">General Study</option>
          </select>

          <p className="text-[10px] text-slate-500 mt-3">
            Select the subject you are currently studying.
          </p>
        </div>

        {/* ATMOSPHERE */}
        <div className="rounded-2xl border border-cyan-500/15 bg-[#08121e] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wider uppercase">
              Focus Atmosphere
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {atmospheres.map((item) => (
              <button
                key={item.id}
                onClick={() => setSoundscape(item.id)}
                className={`rounded-lg py-2.5 px-2 text-[10px] sm:text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                  soundscape === item.id
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300'
                    : 'bg-[#030912] border-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 mt-3">
            Choose your preferred visual atmosphere.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="rounded-xl border border-white/5 bg-[#070d16] px-4 py-4 flex items-center gap-3">
        <Clock3 className="w-5 h-5 text-cyan-500 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Focus sessions contribute to your study progress, XP and Gold.
          Complete your session to receive your rewards.
        </p>
      </div>
    </div>
  );
};
