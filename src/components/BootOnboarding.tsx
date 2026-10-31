import React, { useState, useEffect } from 'react';
import { JobPath } from '../types';
import { sound } from '../utils/sound';
import { importBackup } from '../utils/storage';
import { Sparkles, Terminal, Upload, UserPlus, ArrowLeft } from 'lucide-react';

interface Props {
  onComplete: (name: string, path: JobPath, goalMinutes: number, goalTitle: string) => void;
  soundEnabled: boolean;
}

export const BootOnboarding: React.FC < Props > = ({ onComplete, soundEnabled }) => {
  const [step, setStep] = useState < 'welcome' | 'restore' | 'boot' | 'name' | 'path' | 'goal' > ('welcome');
  const [logLines, setLogLines] = useState < string[] > ([]);
  const [name, setName] = useState('');
  const [path, setPath] = useState < JobPath > ('Scholar');
  const [goalTitle, setGoalTitle] = useState('Master core subjects & exams');
  const [goalMinutes, setGoalMinutes] = useState(60);
  const [restoreError, setRestoreError] = useState('');
  const [restoreDone, setRestoreDone] = useState(false);
  
  useEffect(() => {
    if (step !== 'boot') return;
    sound.playArise(soundEnabled);
    const lines = [
      'Initializing secure system kernel...',
      'Verifying neural sync protocols...',
      'System linked. Operator authorized.',
      'Configuring study environment...'
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setLogLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStep('name'), 700);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [step, soundEnabled]);
  
  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sound.playSuccess(soundEnabled);
    onComplete(name.trim(), path, goalMinutes, goalTitle);
  };
  
  const handleRestoreFile = (e: React.ChangeEvent < HTMLInputElement > ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      let parsed: { player ? : { name ? : string };quests ? : unknown } | null = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = null;
      }
      const valid =
        parsed &&
        parsed.player &&
        parsed.quests &&
        parsed.player.name &&
        parsed.player.name !== 'Player';
      if (valid && importBackup(content)) {
        sound.playSuccess(soundEnabled);
        setRestoreDone(true);
        setTimeout(() => window.location.reload(), 900);
      } else {
        setRestoreError('Invalid backup file. Please choose the .json file you exported from Settings.');
      }
    };
    reader.onerror = () => setRestoreError('Could not read the file. Please try again.');
    reader.readAsText(file);
    e.target.value = '';
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-md pro-card p-8 space-y-6 relative overflow-hidden shadow-2xl border-slate-800">
        <div className="text-center space-y-1">
          <div className="text-[11px] font-semibold text-blue-400 tracking-widest uppercase">SYSTEM AWAKENING</div>
          <h1 className="text-2xl font-bold text-white tracking-wide">SHADOW STUDY</h1>
        </div>

        {step === 'welcome' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-xs text-slate-400 text-center uppercase tracking-wider">Select your status</div>
            <button
              type="button"
              onClick={() => setStep('boot')}
              className="w-full p-4 rounded-lg border border-blue-500 bg-blue-600/10 hover:bg-blue-600/20 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <UserPlus className="w-4 h-4 text-blue-400" /> New Hunter
              </div>
              <div className="text-xs text-slate-400 mt-1">Start a fresh journey and create your profile.</div>
            </button>
            <button
              type="button"
              onClick={() => { setRestoreError(''); setRestoreDone(false); setStep('restore'); }}
              className="w-full p-4 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Upload className="w-4 h-4 text-blue-400" /> Old Hunter
              </div>
              <div className="text-xs text-slate-400 mt-1">Restore your progress from a backup file.</div>
            </button>
          </div>
        )}

        {step === 'restore' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-xs text-slate-300 leading-relaxed">
              Choose the backup file (.json) you exported earlier from <span className="text-blue-400 font-semibold">Settings &rarr; Export Backup</span>. Your previous data will be restored automatically.
            </div>

            <label className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Import Backup
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>

            {restoreError && (
              <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">{restoreError}</div>
            )}
            {restoreDone && (
              <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
                Data restored. Welcome back, Hunter...
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="w-full py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {step === 'boot' && (
          <div className="space-y-2.5 min-h-[160px] text-xs font-mono text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-900">
            {logLines.map((line, idx) => (
              <div key={idx} className={idx === 2 ? 'text-blue-400 font-medium' : ''}>
                &gt; {line}
              </div>
            ))}
            <div className="flex items-center gap-2 text-blue-400 animate-pulse pt-2">
              <Terminal className="w-4 h-4" /> Establishing session...
            </div>
          </div>
        )}

        {step === 'name' && (
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setStep('path'); }} className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">Operator Designation (Name):</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={25}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md"
            >
              Continue &rarr;
            </button>
          </form>
        )}

        {step === 'path' && (
          <div className="space-y-4 animate-fadeIn">
            <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Select Study Discipline / Path:</label>
            <div className="grid grid-cols-1 gap-2.5">
              {(['Scholar', 'Strategist', 'Endurer'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPath(p); setStep('goal'); }}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    path === p ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{p} Discipline</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {p === 'Scholar' ? 'Optimized for deep knowledge absorption.' : p === 'Strategist' ? 'Focused on structural planning and problem-solving.' : 'Engineered for sustained marathon study endurance.'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'goal' && (
          <form onSubmit={handleFinish} className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">Main Study Objective:</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Master Advanced Mathematics"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors mb-4"
                required
              />
              <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">Daily Study Goal (Minutes):</label>
              <input
                type="number"
                value={goalMinutes}
                onChange={(e) => setGoalMinutes(Math.max(15, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                min={15}
                max={480}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Initialize System
            </button>
          </form>
        )}
      </div>
    </div>
  );
};