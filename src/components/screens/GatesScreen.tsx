import React, { useState } from 'react';
import { AppData, Gate, GateRank, GateStep } from '../../types';
import { Shield, CheckCircle, Plus, AlertTriangle, X } from 'lucide-react';

interface Props {
  data: AppData;
  onAddGate: (gate: Gate) => void;
  onToggleGateStep: (gateId: string, stepId: string) => void;
  onCompleteBoss: (gateId: string) => void;
  onTriggerDoubleDungeon: (gateTitle: string) => void;
}

export const GatesScreen: React.FC<Props> = ({ data, onAddGate, onToggleGateStep, onCompleteBoss, onTriggerDoubleDungeon }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [rank, setRank] = useState<GateRank>('E');
  const [stepText1, setStepText1] = useState('');
  const [stepText2, setStepText2] = useState('');
  const [bossTask, setBossTask] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bossTask.trim()) return;
    const steps: GateStep[] = [];
    if (stepText1.trim()) steps.push({ id: `gs_${Date.now()}_1`, text: stepText1.trim(), completed: false });
    if (stepText2.trim()) steps.push({ id: `gs_${Date.now()}_2`, text: stepText2.trim(), completed: false });
    if (steps.length === 0) steps.push({ id: `gs_${Date.now()}_1`, text: 'Complete baseline preparation', completed: false });

    const rewardXp = rank === 'S' ? 500 : rank === 'A' ? 350 : rank === 'B' ? 250 : rank === 'C' ? 180 : rank === 'D' ? 120 : 80;
    const rewardGold = Math.round(rewardXp / 2);

    const newGate: Gate = {
      id: `gate_${Date.now()}`,
      title,
      description: desc || 'Dungeon Gate objective',
      rank,
      steps,
      bossTask,
      bossCompleted: false,
      rewardXp,
      rewardGold,
      cleared: false,
    };
    onAddGate(newGate);
    setTitle('');
    setDesc('');
    setStepText1('');
    setStepText2('');
    setBossTask('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pro-card p-6">
        <div>
          <div className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">DUNGEON GATE SYSTEM</div>
          <h1 className="text-2xl font-bold text-white mt-1">Dungeon Gates & Boss Challenges</h1>
          <p className="text-xs text-slate-400 mt-0.5">Conquer major study milestones structured as Dungeon Gates.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Gate
        </button>
      </div>

      {/* Gates List */}
      <div className="space-y-6">
        {data.gates.length === 0 ? (
          <div className="pro-card p-12 text-center text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-400" />
            <p className="text-sm font-medium">No Dungeon Gates discovered.</p>
            <p className="text-xs text-slate-500 mt-1">Create a Gate above to start major study expeditions.</p>
          </div>
        ) : (
          data.gates.map((gate) => {
            const allStepsDone = gate.steps.every((s) => s.completed);
            return (
              <div
                key={gate.id}
                className={`pro-card p-6 transition-all ${
                  gate.cleared ? 'border-emerald-500/30 opacity-80' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 uppercase">
                        Rank {gate.rank} Gate
                      </span>
                      {gate.cleared && (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase">
                          Gate Cleared
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{gate.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{gate.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-blue-400 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-500/20">+{gate.rewardXp} XP</span>
                    <span className="text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/20">+{gate.rewardGold} Credits</span>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2.5 mb-6">
                  <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Gate Steps ({gate.steps.filter(s => s.completed).length} / {gate.steps.length})</div>
                  {gate.steps.map((step) => (
                    <div
                      key={step.id}
                      onClick={() => !gate.cleared && onToggleGateStep(gate.id, step.id)}
                      className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        step.completed ? 'bg-blue-950/20 border-blue-500/30 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${step.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700'}`}>
                          {step.completed && <CheckCircle className="w-3 h-3" />}
                        </div>
                        <span className={step.completed ? 'line-through text-slate-500' : ''}>{step.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Boss Challenge */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold text-red-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Final Boss Challenge
                    </div>
                    <div className="text-sm font-semibold text-white">{gate.bossTask}</div>
                  </div>
                  {!gate.cleared && (
                    <button
                      onClick={() => {
                        onCompleteBoss(gate.id);
                        onTriggerDoubleDungeon(gate.title);
                      }}
                      disabled={!allStepsDone || gate.bossCompleted}
                      className={`px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        allStepsDone && !gate.bossCompleted
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {gate.bossCompleted ? 'Boss Defeated' : 'Defeat Boss'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Gate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md pro-card p-6 border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Create Dungeon Gate</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">Gate Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Calculus Gate Alpha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brief overview..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">Rank</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as GateRank)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="E">Rank E</option>
                  <option value="D">Rank D</option>
                  <option value="C">Rank C</option>
                  <option value="B">Rank B</option>
                  <option value="A">Rank A</option>
                  <option value="S">Rank S</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">Gate Step 1</label>
                <input
                  type="text"
                  value={stepText1}
                  onChange={(e) => setStepText1(e.target.value)}
                  placeholder="e.g. Read Chapters 1-3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">Gate Step 2</label>
                <input
                  type="text"
                  value={stepText2}
                  onChange={(e) => setStepText2(e.target.value)}
                  placeholder="e.g. Solve 30 practice questions"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">Final Boss Task</label>
                <input
                  type="text"
                  value={bossTask}
                  onChange={(e) => setBossTask(e.target.value)}
                  placeholder="e.g. 60 minute timed mock test"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow cursor-pointer"
                >
                  Open Gate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
