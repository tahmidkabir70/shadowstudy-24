import React, { useEffect, useState } from 'react';
import { AppData } from '../../types';
import { Play, Pause, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { sound } from '../../utils/sound';

interface Props {
  data: AppData;
  onFinishSession: (minutes: number, subject: string) => void;
}

const TIMER_STORAGE_KEY = 'SHADOW_STUDY_TIMER_STATE';

export const FocusScreen: React.FC<Props> = ({ data, onFinishSession }) => {
  const [durationMins, setDurationMins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.durationMins) return parsed.durationMins;
      }
    } catch {}
    return 25;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.endTimestamp) {
          const remaining = Math.max(0, Math.round((parsed.endTimestamp - Date.now()) / 1000));
          return remaining > 0 ? remaining : parsed.durationMins * 60;
        }
      }
    } catch {}
    return 25 * 60;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.endTimestamp && parsed.endTimestamp > Date.now()) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  const [selectedSubject, setSelectedSubject] = useState<string>(data.subjects[0]?.name || 'General');
  const [isBreak, setIsBreak] = useState<boolean>(false);

  // Save timer state to localStorage whenever running state changes
  useEffect(() => {
    if (isRunning) {
      const endTimestamp = Date.now() + timeLeft * 1000;
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ endTimestamp, durationMins, selectedSubject }));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [isRunning, timeLeft, durationMins, selectedSubject]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            localStorage.removeItem(TIMER_STORAGE_KEY);
            sound.playSuccess(data.settings.soundEnabled);
            if (!isBreak) {
              onFinishSession(durationMins, selectedSubject);
              setIsBreak(true);
              return 5 * 60; // 5 min break
            } else {
              setIsBreak(false);
              return durationMins * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, durationMins, isBreak, selectedSubject, onFinishSession, data.settings.soundEnabled]);

  const setTimerPreset = (mins: number) => {
    setIsRunning(false);
    setIsBreak(false);
    setDurationMins(mins);
    setTimeLeft(mins * 60);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((isBreak ? 300 : durationMins * 60 - timeLeft) / (isBreak ? 300 : durationMins * 60)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="pro-card p-6 text-center">
        <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">FOCUS SYSTEM GATE</div>
        <h1 className="text-2xl font-bold text-white mt-1">
          {isBreak ? 'SYSTEM REST / BREAK' : 'FOCUS & STUDY SESSION'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {isBreak ? 'Relax your mind before the next gate.' : 'Immerse in focused study to earn XP and attributes.'}
        </p>
      </div>

      <div className="pro-card p-8 text-center relative overflow-hidden">
        {!isBreak && (
          <div className="flex justify-center gap-2 mb-8">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setTimerPreset(mins)}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  durationMins === mins && !isBreak
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {mins} Mins
              </button>
            ))}
          </div>
        )}

        <div className="my-8">
          <div className="text-6xl md:text-7xl font-black font-mono tracking-wider text-white">
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-6 max-w-md mx-auto">
            <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {!isBreak && (
          <div className="max-w-xs mx-auto mb-8 text-xs font-medium">
            <label className="text-slate-400 block mb-2 uppercase tracking-wider">Target Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {data.subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
              <option value="General">General Study</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3 rounded-lg text-xs uppercase font-bold flex items-center gap-2 shadow transition-all ${
              isRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isRunning ? <><Pause className="w-4 h-4" /> Pause Gate</> : <><Play className="w-4 h-4" /> Begin Focus</>}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durationMins * 60);
              setIsBreak(false);
              localStorage.removeItem(TIMER_STORAGE_KEY);
            }}
            className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
