import React, { useState } from 'react';
import { AppData, PlannerItem } from '../../types';
import { Calendar, Plus, CheckCircle, Trash2 } from 'lucide-react';

interface Props {
  data: AppData;
  onAddPlanner: (item: PlannerItem) => void;
  onTogglePlanner: (id: string) => void;
  onDeletePlanner: (id: string) => void;
}

export const PlannerScreen: React.FC<Props> = ({ data, onAddPlanner, onTogglePlanner, onDeletePlanner }) => {
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>('Mon');
  const [time, setTime] = useState('');
  const [subject, setSubject] = useState('');
  const [task, setTask] = useState('');

  const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !task) return;
    onAddPlanner({
      id: `plan_${Date.now()}`,
      day: selectedDay,
      time,
      subject: subject || 'General',
      task,
      completed: false,
    });
    setTime('');
    setTask('');
  };

  const filtered = data.planner.filter((p) => p.day === selectedDay);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <div className="text-xs font-mono text-cyan-400 tracking-widest">[ SYSTEM AGENDA ]</div>
        <h1 className="text-2xl font-bold font-mono text-white mt-1">7-Day Study Planner</h1>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase font-bold transition-all ${
              selectedDay === day ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-900 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Add Planner Form */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <h2 className="text-sm font-mono text-cyan-400 mb-4">ADD PLANNER TASK FOR {selectedDay.toUpperCase()}</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <input
            type="text"
            placeholder="Time (e.g. 09:00 AM)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2.5 text-white"
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2.5 text-white"
          />
          <input
            type="text"
            placeholder="Task description"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2.5 text-white md:col-span-2"
            required
          />
          <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl md:col-span-4">
            Add to Agenda
          </button>
        </form>
      </div>

      {/* Planner Items */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between font-mono">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onTogglePlanner(item.id)}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                  item.completed ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-cyan-500/50 bg-slate-950'
                }`}
              >
                {item.completed && <CheckCircle className="w-4 h-4" />}
              </button>
              <div>
                <div className="text-xs text-cyan-400">{item.time} • {item.subject}</div>
                <div className={`text-sm font-bold ${item.completed ? 'line-through text-cyan-600' : 'text-white'}`}>{item.task}</div>
              </div>
            </div>
            <button onClick={() => onDeletePlanner(item.id)} className="text-slate-500 hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
