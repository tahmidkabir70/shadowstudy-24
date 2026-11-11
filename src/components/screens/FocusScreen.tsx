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
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface Props {
  data: AppData;
  onFinishSession: (minutes: number, subject: string) => void;
}

const TIMER_STORAGE_KEY = 'SHADOW_STUDY_TIMER_STATE';

type Soundscape = 'silence' | 'rain' | 'dungeon' | 'cyberpunk';

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
   No external files needed.
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
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        // already stopped
      }
    });
    this.nodes.forEach((n) => {
      try {
        n.disconnect();
      } catch {
        // ignore
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
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRain() {
    this.ensureContext();
    const buffer = this.createNoiseBuffer(3);
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
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

  private startDungeon() {
    this.ensureContext();

    // Low drone
    const osc1 = this.ctx!.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;

    const osc2 = this.ctx!.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 82.5;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0.18;

    // Subtle noise layer
    const noise = this.ctx!.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const noiseFilter = this.ctx!.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;

    const noiseGain = this.ctx!.createGain();
    noiseGain.gain.value = 0.08;

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

    this.sources.push(osc1, osc2, noise);
    this.nodes.push(filter, gain, noiseFilter, noiseGain);
  }

  private startCyberpunk() {
    this.ensureContext();

    // Soft detuned pads
    const freqs = [110, 138.59, 164.81];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.value = f;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600 + i * 120;

      const gain = this.ctx!.createGain();
      gain.gain.value = 0.06;

      // Slow LFO for movement
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 40;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      lfo.start();

      this.sources.push(osc, lfo);
      this.nodes.push(filter, gain, lfoGain);
    });

    // Light high noise shimmer
    const noise = this.ctx!.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2);
    noise.loop = true;

    const nFilter = this.ctx!.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 1800;

    const nGain = this.ctx!.createGain();
    nGain.gain.value = 0.03;

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.masterGain!);
    noise.start();

    this.sources.push(noise);
    this.nodes.push(nFilter, nGain);
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
    else if (type === 'cyberpunk') this.startCyberpunk();

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
      // ignore
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
      // ignore
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `\( {mins.toString().padStart(2, '0')}: \){secs
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
    { id: 'rain' as const, label: 'Rain' },
    { id: 'dungeon' as const, label: 'Dungeon' },
    { id: 'cyberpunk' as const, label: 'Cyberpunk' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn pb-12 px-1">
      {/* SYSTEM HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#07111d] p-5 sm:p-6">
        <div className="absolute -top-24 -right-20 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-600/10 blur-[70px] rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.22em] text-cyan-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
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

          <div className="hidden sm:flex w-14 h-14 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Zap className="w-7 h-7 text-cyan-300" />
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl bg-black/40 border border-white/5 p-3">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Current Quest
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {isBreak ? 'Rest Period' : `${durationMins} Min Focus`}
            </div>
          </div>

          <div className="rounded-xl bg-black/40 border border-white/5 p-3">
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
              <span className={isRunning ? 'text-emerald-400' : 'text-amber-400'}>
                {isRunning ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TIMER */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-[#0b1928] to-[#050a12] px-4 py-8 sm:py-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-cyan-400/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-violet-600/10 blur-[60px] pointer-events-none" />

        <div className="relative text-center">
          <div className="text-[10px] sm:text-xs font-mono tracking-[0.32em] text-cyan-400 uppercase mb-7">
            {isBreak ? 'RECOVERY COUNTDOWN' : 'TIME REMAINING'}
          </div>

          <div
            className="relative mx-auto w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] rounded-full p-[8px]"
            style={{
              background: `conic-gradient(from -90deg, #22d3ee ${
                progressPercent * 3.6
              }deg, rgba(30, 64, 80, 0.35) ${
                progressPercent * 3.6
              }deg 360deg)`,
              boxShadow: '0 0 40px rgba(34,211,238,0.15)',
            }}
          >
            <div className="w-full h-full rounded-full bg-[#06101b] border border-cyan-400/15 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-5 rounded-full border border-cyan-400/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06)_0%,transparent_70%)]" />

              <div className="relative text-[10px] tracking-[0.28em] font-mono text-cyan-500/90 uppercase mb-3">
                {isRunning ? (isBreak ? 'RECOVERING' : 'CONCENTRATING') : 'READY'}
              </div>

              <div className="relative text-[52px] sm:text-[64px] font-black font-mono tracking-tight text-white tabular-nums drop-shadow-[0_0_22px_rgba(34,211,238,0.4)]">
                {formatTime(timeLeft)}
              </div>

              <div className="relative mt-3 text-[10px] font-mono text-slate-500 tracking-widest">
                {progressPercent}% COMPLETED
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
                      ? 'bg-cyan-400 text-[#04111d] border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
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

        <div className="relative flex items-center justify-center gap-3 mt-8">
          <button
            onClick={handleToggle}
            className={`flex-1 max-w-[230px] py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black tracking-wider transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_22px_rgba(245,158,11,0.25)]'
                : 'bg-cyan-400 hover:bg-cyan-300 text-[#04111d] shadow-[0_0_28px_rgba(34,211,238,0.3)]'
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
            className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#101d2a] border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SESSION SETTINGS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SUBJECT */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#08121e] p-5">
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
            className="w-full bg-[#030912] border border-cyan-500/25 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50"
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
        <div className="rounded-2xl border border-cyan-500/20 bg-[#08121e] p-5">
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
            {data.settings.soundEnabled
              ? 'Atmosphere will play while the timer is running.'
              : 'Sound is currently disabled in settings.'}
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="rounded-xl border border-white/5 bg-[#070d16] px-4 py-4 flex items-center gap-3">
        <Clock3 className="w-5 h-5 text-cyan-500 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Focus sessions contribute to your study progress, XP and Gold.
          Clear the gate to receive your rewards from the System.
        </p>
      </div>
    </div>
  );
};