import React, { useState } from 'react';
import { AppData, NoteItem } from '../../types';
import { localDateStr } from '../../utils/date';
import { Plus, Pin, Trash2, Search } from 'lucide-react';

interface Props {
  data: AppData;
  onAddNote: (note: NoteItem) => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesScreen: React.FC<Props> = ({ data, onAddNote, onTogglePin, onDeleteNote }) => {
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('General');
  const [showModal, setShowModal] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddNote({
      id: 'note_' + Date.now(),
      title,
      content,
      subject,
      pinned: false,
      updatedAt: localDateStr(),
    });
    setTitle('');
    setContent('');
    setShowModal(false);
  };

  const filtered = data.notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest">[ SYSTEM ARCHIVES ]</div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">Study Notes</h1>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((note) => (
          <div key={note.id} className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">{note.subject}</span>
                <button onClick={() => onTogglePin(note.id)} className={`p-1.5 rounded-lg cursor-pointer ${note.pinned ? 'text-yellow-400' : 'text-slate-500 hover:text-white'}`}>
                  <Pin className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-base font-bold font-mono text-white mb-2">{note.title}</h3>
              <p className="text-xs font-mono text-cyan-400/80 whitespace-pre-line line-clamp-4">{note.content}</p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-cyan-500/20 text-[10px] font-mono text-slate-500">
              <span>{note.updatedAt}</span>
              <button onClick={() => onDeleteNote(note.id)} className="hover:text-red-400 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg font-mono font-bold text-cyan-300 mb-4">[ CREATE NOTE ]</h2>
            <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
              <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white"
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white"
              />
              <textarea
                placeholder="Write note contents..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white h-32 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-400 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold cursor-pointer">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
