import React, { useEffect, useRef, useState } from 'react';
import { AppData } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Clock3,
  Target,
  Zap,
  Shield,
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface Props {
  data: AppData;
  onFinishSession: (minutes: number, subject: string) => void;
}

const TIMER_STORAGE_KEY = 'SHADOW_STUDY_TIMER_STATE';

type Soundscape = 'silence' | 'rain' | 'dungeon' | 'monarch';

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

/* ──────────────────────────────────────────────
   Ambient Sound Engine (Web Audio API)
   Themed for Solo Leveling atmospheres.
────────────────────────────────────────────── */
class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private isPlaying = false;
  private current: Soundscape = 'silence';

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private clear() {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    this.nodes.forEach((n) => {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.sources = [];
    this.nodes = [];
  }

  private createNoiseBuffer(seconds = 4): AudioBuffer {
    this.ensureContext();
    const sampleRate = this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, sampleRate * seconds, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /* ── RAIN ── soft rainfall with muffled lowpass */
  private startRain() {
    this.ensureContext();
    const buffer = this.createNoiseBuffer(3);
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.7;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0.55;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    source.start();
    this.sources.push(source);
    this.nodes.push(filter, gain);
  }

  /* ── DUNGEON DEPTHS ── ominous low drone with slow pulse */
  private startDungeon() {
    this.ensureContext();

    const sub = this.ctx!.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 38;
    const subGain = this.ctx!.createGain();
    subGain.gain.value = 0.14;
    sub.connect(subGain);
    subGain.connect(this.masterGain!);
    sub.start();

    const osc1 = this.ctx!.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;

    const osc2 = this.ctx!.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 82.5;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 190;
    filter.Q.value = 4;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0.16;

    // Slow pulse (heartbeat-like)
    const lfo = this.ctx!.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx!.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const noise = this.ctx!.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const noiseFilter = this.ctx!.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 350;

    const noiseGain = this.ctx!.createGain();
    noiseGain.gain.value = 0.07;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    osc1.start();
    osc2.start();
    noise.start();

    this.sources.push(sub, osc1, osc2, noise, lfo);
    this.nodes.push(subGain, filter, gain, noiseFilter, noiseGain, lfoGain);
  }

  /* ── SHADOW MONARCH ── dark epic minor pads + sub drone */
  private startMonarch() {
    this.ensureContext();

    // Deep sub bass drone
    const sub = this.ctx!.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 41.2; // E1
    const subGain = this.ctx!.createGain();
    subGain.gain.value = 0.11;
    sub.connect(subGain);
    subGain.connect(this.masterGain!);
    sub.start();

    // A minor triad pads (A2, C3, E3)
    const freqs = [110, 130.81, 164.81];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = f;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420 + i * 220;
      filter.Q.value = 2.5;

      const gain = this.ctx!.createGain();
      gain.gain.value = 0.055;

      // Breathing LFO
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + i * 0.02;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 110;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();

      this.sources.push(osc, lfo);
      this.nodes.push(filter, gain, lfoGain);
    });

    // Subtle high shimmer
    const noise = this.ctx!.createBufferSource();
    noise.buffer = this.createNoiseBuffer(3);
    noise.loop = true;

    const nFilter = this.ctx!.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 2400;

    const nGain = this.ctx!.createGain();
    nGain.gain.value = 0.025;

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.masterGain!);
    noise.start();

    this.sources.push(sub, noise);
    this.nodes.push(subGain, nFilter, nGain);
  }

  play(type: Soundscape) {
    if (type === this.current && this.isPlaying) return;

    this.stop();
    this.current = type;

    if (type === 'silence') {
      this.isPlaying = false;
      return;
    }

    this.ensureContext();

    if (type === 'rain') this.startRain();
    else if (type === 'dungeon') this.startDungeon();
    else if (type === 'monarch') this.startMonarch();

    this.isPlaying = true;
  }

  pause() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    this.clear();
    this.isPlaying = false;
    this.current = 'silence';
  }

  setVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
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
  const [soundscape, setSoundscape] = useState<Soundscape>('silence');

  const ambientRef = useRef<AmbientEngine | null>(null);

  // Init ambient engine
  useEffect(() => {
    ambientRef.current = new AmbientEngine();
    return () => {
      ambientRef.current?.destroy();
    };
  }, []);

  // Control ambient based on running state + selected soundscape + settings
  useEffect(() => {
    const engine = ambientRef.current;
    if (!engine) return;

    const soundOn = data.settings.soundEnabled;

    if (!soundOn || soundscape === 'silence' || !isRunning) {
      if (!isRunning) {
        engine.pause();
      } else {
        engine.stop();
      }
      return;
    }

    engine.play(soundscape);
    engine.resume();
  }, [isRunning, soundscape, data.settings.soundEnabled]);

  // Persist running timer
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
      // Storage may be unavailable
    }
  }, [isRunning, timeLeft, durationMins, selectedSubject]);

  // Session complete → recovery
  useEffect(() => {
    if (!isRunning || timeLeft > 0) return;

    setIsRunning(false);
    setIsBreak(true);
    setTimeLeft(5 * 60);

    ambientRef.current?.stop();
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

  // Countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const setTimerPreset = (mins: number) => {
    if (isRunning) return;

    setIsRunning(false);
    setIsBreak(false);
    setDurationMins(mins);
    setTimeLeft(mins * 60);
    ambientRef.current?.stop();

    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleToggle = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(durationMins * 60);
    ambientRef.current?.stop();

    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const totalSeconds = isBreak ? 300 : durationMins * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100))
  );

  const presets = [15, 25, 45, 60];

  const atmospheres = [
    { id: 'silence' as const, label: 'Silence' },
    { id: 'rain' as const, label: 'Rainfall' },
    { id: 'dungeon' as const, label: 'Dungeon' },
    { id: 'monarch' as const, label: 'Monarch' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn pb-12 px-1">
      {/* ═══════════ SYSTEM HEADER ═══════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-[#060b18] p-5 sm:p-6">
        <div className="absolute -top-24 -right-20 w-64 h-64 bg-blue-500/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-600/15 blur-[80px] rounded-full pointer-events-none" />

        {/* Solo Leveling style corner brackets */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-400/70" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-400/70" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-400/70" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-400/70" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.22em] text-blue-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_14px_#3b82f6] animate-pulse" />
              SHADOW SYSTEM // FOCUS GATE
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-wide">
              {isBreak ? 'RECOVERY PROTOCOL' : 'HUNTER FOCUS MODE'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md">
              {isBreak
                ? 'Session complete. Mana recovering. Prepare for the next gate.'
                : 'Enter the gate. Clear your mind. Earn experience and gold.'}
            </p>
          </div>

          <div className="hidden sm:flex w-14 h-14 rounded-2xl border border-blue-400/40 bg-blue-400/10 items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.25)]">
            <Zap className="w-7 h-7 text-blue-300" />
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl bg-black/50 border border-white/5 p-3">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Current Quest
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {isBreak ? 'Rest Period' : `${durationMins} Min Focus`}
            </div>
          </div>

          <div className="rounded-xl bg-black/50 border border-white/5 p-3">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              System Status
            </div>
            <div className="flex items-center gap-2 text-sm font-bold mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                    : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                }`}
              />
              <span
                className={isRunning ? 'text-emerald-400' : 'text-amber-400'}
              >
                {isRunning ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN TIMER ═══════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#0a1224] to-[#03060d] px-4 py-8 sm:py-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-blue-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-violet-600/15 blur-[70px] pointer-events-none" />

        {/* Corner brackets - Solo Leveling system window */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400/60" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400/60" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400/60" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400/60" />

        <div className="relative text-center">
          <div className="text-[10px] sm:text-xs font-mono tracking-[0.32em] text-blue-400 uppercase mb-7">
            {isBreak ? 'RECOVERY COUNTDOWN' : 'TIME REMAINING'}
          </div>

          {/* ── CLEAN TIMER CIRCLE ── */}
          <div
            className="relative mx-auto w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] rounded-full p-[8px]"
            style={{
              background: `conic-gradient(from -90deg, #3b82f6 ${
                progressPercent * 3.6
              }deg, rgba(30, 58, 90, 0.35) ${progressPercent * 3.6}deg 360deg)`,
              boxShadow: '0 0 50px rgba(59,130,246,0.22)',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#050a14] to-[#02040a] border border-blue-500/20 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Decorative inner ring */}
              <div className="absolute inset-5 rounded-full border border-blue-500/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.09)_0%,transparent_70%)]" />

              {/* Big time — the only dominant element */}
              <div className="relative text-[54px] sm:text-[64px] font-black font-mono tracking-tighter text-white tabular-nums leading-none drop-shadow-[0_0_24px_rgba(96,165,250,0.5)]">
                {formatTime(timeLeft)}
              </div>

              {/* Small status label below */}
              <div className="relative mt-3 text-[9px] font-mono tracking-[0.25em] text-blue-400/80 uppercase">
                {isRunning
                  ? isBreak
                    ? 'RECOVERING'
                    : 'IN COMBAT'
                  : 'STANDBY'}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-7 font-mono">
            {isRunning
              ? isBreak
                ? 'Recovery in progress. Stay ready for the next quest.'
                : 'Stay focused. Your progress is being recorded by the System.'
              : 'Every focused minute strengthens the Hunter.'}
          </p>
        </div>

        {!isBreak && (
          <div className="relative mt-9">
            <div className="text-[10px] text-slate-500 font-mono tracking-[0.22em] uppercase text-center mb-3">
              SELECT DURATION
            </div>

            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {presets.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTimerPreset(mins)}
                  disabled={isRunning}
                  className={`rounded-xl py-3 text-xs sm:text-sm font-mono font-bold border transition-all ${
                    durationMins === mins
                      ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_22px_rgba(59,130,246,0.45)]'
                      : 'bg-[#0a1524] text-slate-400 border-white/10 hover:border-blue-400/60 hover:text-blue-300'
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

        <div className="relative flex items-center justify-center gap-3 mt-8">
          <button
            onClick={handleToggle}
            className={`flex-1 max-w-[230px] py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black tracking-wider transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_22px_rgba(245,158,11,0.3)]'
                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_32px_rgba(59,130,246,0.45)]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                {isBreak ? 'PAUSE BREAK' : 'PAUSE'}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {isBreak ? 'START BREAK' : 'START FOCUS'}
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#0d1826] border border-blue-500/30 text-blue-300 hover:bg-blue-500/15 hover:border-blue-400/60 transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══════════ SESSION SETTINGS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SUBJECT */}
        <div className="relative rounded-2xl border border-blue-500/25 bg-[#070f1c] p-5 overflow-hidden">
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-blue-400/50" />
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white tracking-wider uppercase">
              Target Subject
            </h2>
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isRunning || isBreak}
            className="w-full bg-[#030812] border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"
          >
            {data.subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
            <option value="General">General Study</option>
          </select>

          <p className="text-[10px] text-slate-500 mt-3">
            Select the subject you are currently hunting.
          </p>
        </div>

        {/* ATMOSPHERE / SOUND */}
        <div className="relative rounded-2xl border border-blue-500/25 bg-[#070f1c] p-5 overflow-hidden">
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-blue-400/50" />
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4 text-blue-400" />
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
                    ? 'bg-blue-500/20 border-blue-400/70 text-blue-200 shadow-[0_0_14px_rgba(59,130,246,0.25)]'
                    : 'bg-[#030812] border-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 mt-3">
            {data.settings.soundEnabled
              ? 'Atmosphere will play while the timer is running.'
              : 'Sound is currently disabled in settings.'}
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="rounded-xl border border-white/5 bg-[#060c16] px-4 py-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Focus sessions contribute to your study progress, XP and Gold.
          Clear the gate to receive your rewards from the System.
        </p>
      </div>
    </div>
  );
};