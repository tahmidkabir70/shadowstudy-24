import React, { useEffect, useState } from 'react';
import { Flame, Eye, EyeOff, ShieldCheck, Wind, Trophy, Check, Lock } from 'lucide-react';
import { AppData } from '../../types';
import { localDateStr } from '../../utils/date';
import { VOW_MILESTONES, VOW_REWARDS, defaultVow, vowStreakDays } from '../../utils/vow';

interface Props {
  data: AppData;
  onNavigate: (tab: string) => void;
  onBegin: (vowId: string, daysAlready: number) => void;
  onRelapse: (vowId: string) => void;
  onClaim: (vowId: string, days: number) => void;
  onTogglePrivate: () => void;
}

const EN = {
  tag: '[ SELF-CONTROL VOW ]',
  title: 'Vow Streaks',
  sub: 'Your streak counts full days since you began or last reset. Data stays on this device.',
  vow: 'Vow',
  days: 'days',
  best: 'Best',
  resets: 'Resets',
  begin: 'Begin',
  already: 'Already clean for how many days?',
  slipped: 'I slipped',
  confirmAsk: 'Reset this streak? Counting restarts today. Your best record stays saved.',
  yes: 'Yes, reset',
  cancel: 'Cancel',
  claim: 'Claim',
  next: 'Next goal',
  maxed: 'All milestones reached',
  slipNote: 'A slip is data, not defeat. Reset, learn the trigger, start again.',
  privateOn: 'Private mode on (names hidden)',
  privateOff: 'Hide vow names',
  urgeBtn: 'I have an urge right now',
  urgeTitle: 'Do this now',
  steps: [
    'Leave the room. Get off the bed and put your phone down.',
    'Drink a glass of water.',
    'Walk outside or do 20 push-ups.',
    'Message or call someone.',
    'Sit for a 10-minute study sprint.',
  ],
  timerStart: 'Start 10-minute timer',
  timerRunning: 'Hold on. Urges rise and fall in waves.',
  timerDone: 'Time is up. You rode it out.',
  focusBtn: 'Start a focus session',
  note: 'If this ever feels out of your control, talking to someone you trust or a counselor can really help.',
};

const BN = {
  tag: '[ আত্মনিয়ন্ত্রণের শপথ ]',
  title: 'শপথের স্ট্রিক',
  sub: 'শুরু বা শেষ রিসেটের পর পূর্ণ দিন গোনা হয়। ডেটা শুধু এই ডিভাইসেই থাকে।',
  vow: 'শপথ',
  days: 'দিন',
  best: 'সেরা',
  resets: 'রিসেট',
  begin: 'শুরু করুন',
  already: 'আগে থেকেই কত দিন পরিষ্কার?',
  slipped: 'আমি ভেঙে ফেলেছি',
  confirmAsk: 'স্ট্রিক রিসেট করবেন? আজ থেকে নতুন করে গোনা শুরু হবে। সেরা রেকর্ড সেভ থাকবে।',
  yes: 'হ্যাঁ, রিসেট',
  cancel: 'বাতিল',
  claim: 'নিন',
  next: 'পরের লক্ষ্য',
  maxed: 'সব লক্ষ্য পূর্ণ',
  slipNote: 'ভেঙে যাওয়া মানে হেরে যাওয়া নয়, এটা শেখার তথ্য। রিসেট করুন, কারণটা চিনুন, আবার শুরু করুন।',
  privateOn: 'গোপন মোড চালু (নাম লুকানো)',
  privateOff: 'শপথের নাম লুকান',
  urgeBtn: 'এখনই ইচ্ছা চাপছে',
  urgeTitle: 'এখনই এটা করুন',
  steps: [
    'ঘর থেকে বেরিয়ে যান। বিছানা ছাড়ুন আর ফোন রেখে দিন।',
    'এক গ্লাস পানি খান।',
    'বাইরে হাঁটুন বা ২০টা পুশ-আপ দিন।',
    'কাউকে মেসেজ করুন বা ফোন দিন।',
    '১০ মিনিটের জন্য পড়তে বসুন।',
  ],
  timerStart: '১০ মিনিটের টাইমার শুরু',
  timerRunning: 'ধরে রাখুন। ইচ্ছা ঢেউয়ের মতো আসে আর চলে যায়।',
  timerDone: 'সময় শেষ। আপনি সামলে নিয়েছেন।',
  focusBtn: 'ফোকাস সেশন শুরু করুন',
  note: 'কখনো নিজের নিয়ন্ত্রণের বাইরে মনে হলে বিশ্বস্ত কারো সাথে বা কাউন্সেলরের সাথে কথা বললে অনেক উপকার হয়।',
};

export const VowScreen: React.FC<Props> = ({ data, onNavigate, onBegin, onRelapse, onClaim, onTogglePrivate }) => {
  const L = data.settings.language === 'bn' ? BN : EN;
  const vow = data.vow || defaultVow();
  const today = localDateStr();

  const [daysInput, setDaysInput] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [urgeOpen, setUrgeOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-slate-900/90 border border-orange-500/30 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-orange-400 tracking-widest">{L.tag}</div>
            <h1 className="text-2xl font-bold font-mono text-white mt-1 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" /> {L.title}
            </h1>
          </div>
          <button
            onClick={onTogglePrivate}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-orange-500/60 cursor-pointer"
          >
            {vow.privateMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {vow.privateMode ? L.privateOn : L.privateOff}
          </button>
        </div>
        <p className="text-xs font-mono text-slate-400 mt-3">{L.sub}</p>
      </div>

      {vow.vows.map((v, i) => {
        const days = vowStreakDays(v, today);
        const best = Math.max(v.bestStreak, days);
        const name = vow.privateMode ? `${L.vow} ${i + 1}` : v.name;
        const started = !!v.startDate;
        const next = VOW_MILESTONES.find((m) => m > days);
        const prevM = [...VOW_MILESTONES].reverse().find((m) => m <= days) || 0;
        const pct = next ? Math.round(((days - prevM) / (next - prevM)) * 100) : 100;
        const claimable = VOW_MILESTONES.filter((m) => days >= m && !v.claimedMilestones.includes(m));

        return (
          <div key={v.id} className="bg-slate-900/90 border border-orange-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono font-bold text-orange-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {name}
              </h2>
              {started && (
                <div className="text-[11px] font-mono text-slate-400">
                  {L.best}: {best} {L.days} · {L.resets}: {v.relapses}
                </div>
              )}
            </div>

            {!started ? (
              <div className="space-y-3">
                <label className="block text-xs font-mono text-slate-400">{L.already}</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min={0}
                    max={3650}
                    value={daysInput[v.id] ?? '0'}
                    onChange={(e) => setDaysInput({ ...daysInput, [v.id]: e.target.value })}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      const n = Math.max(0, Math.min(3650, parseInt(daysInput[v.id] ?? '0', 10) || 0));
                      onBegin(v.id, n);
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-mono text-sm font-bold py-2 rounded-xl cursor-pointer"
                  >
                    {L.begin}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center py-2">
                  <div className="text-6xl font-black font-mono text-white">{days}</div>
                  <div className="text-xs font-mono text-orange-300 tracking-widest uppercase">{L.days}</div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{next ? `${L.next}: ${next} ${L.days}` : L.maxed}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {VOW_MILESTONES.map((m) => {
                    const claimed = v.claimedMilestones.includes(m);
                    const reached = days >= m;
                    return (
                      <span
                        key={m}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                          claimed
                            ? 'border-green-500/40 text-green-300 bg-green-950/30'
                            : reached
                            ? 'border-orange-500/60 text-orange-300 bg-orange-950/30'
                            : 'border-slate-700 text-slate-500'
                        }`}
                      >
                        {claimed ? <Check className="w-3 h-3" /> : reached ? <Trophy className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {m}
                      </span>
                    );
                  })}
                </div>

                {claimable.length > 0 && (
                  <div className="space-y-2">
                    {claimable.map((m) => {
                      const r = VOW_REWARDS[m];
                      return (
                        <button
                          key={m}
                          onClick={() => onClaim(v.id, m)}
                          className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white font-mono text-xs font-bold py-2.5 rounded-xl cursor-pointer animate-pulse"
                        >
                          {L.claim} {m} {L.days}: +{r.xp} XP, +{r.gold} G{r.gp ? `, +${r.gp} GP` : ''}
                        </button>
                      );
                    })}
                  </div>
                )}

                {confirmId === v.id ? (
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-mono text-slate-300">{L.confirmAsk}</p>
                    <p className="text-[11px] font-mono text-slate-500">{L.slipNote}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          onRelapse(v.id);
                          setConfirmId(null);
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs py-2 rounded-xl cursor-pointer"
                      >
                        {L.yes}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 border border-slate-700 text-slate-300 font-mono text-xs py-2 rounded-xl cursor-pointer"
                      >
                        {L.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(v.id)}
                    className="w-full border border-slate-700 hover:border-slate-500 text-slate-400 font-mono text-xs py-2 rounded-xl cursor-pointer"
                  >
                    {L.slipped}
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}

      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
        <button
          onClick={() => setUrgeOpen(!urgeOpen)}
          className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
        >
          <Wind className="w-4 h-4" /> {L.urgeBtn}
        </button>

        {urgeOpen && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-cyan-300">{L.urgeTitle}</h3>
            <ol className="space-y-2 list-decimal list-inside text-xs font-mono text-slate-300">
              {L.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>

            <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4 text-center space-y-3">
              <div className="text-4xl font-black font-mono text-white">
                {mm}:{ss}
              </div>
              <div className="text-[11px] font-mono text-cyan-300">
                {running ? L.timerRunning : secondsLeft === 0 ? L.timerDone : ''}
              </div>
              {!running && (
                <button
                  onClick={() => {
                    setSecondsLeft(600);
                    setRunning(true);
                  }}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  {L.timerStart}
                </button>
              )}
            </div>

            <button
              onClick={() => onNavigate('focus')}
              className="w-full border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 font-mono text-xs py-2.5 rounded-xl cursor-pointer"
            >
              {L.focusBtn}
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] font-mono text-slate-500 px-1">{L.note}</p>
    </div>
  );
};
