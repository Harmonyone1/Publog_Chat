'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

type Session = { id: string; title: string; createdAt: number };
const KEY = 'chat_sessions_v1';

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(list: Session[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export default function ChatHistory({ currentId, onSelect, onNew }: { currentId: string | null; onSelect: (id: string) => void; onNew: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  function addSession() {
    const s: Session = { id: Math.random().toString(36).slice(2) + Date.now().toString(36), title: 'New chat', createdAt: Date.now() };
    const list = [s, ...sessions];
    setSessions(list);
    saveSessions(list);
    onNew();
    onSelect(s.id);
  }

  return (
    <div className="w-56 border-r border-slate-800 p-3 hidden md:block">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">History</div>
        <button className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800" onClick={addSession}>New Chat</button>
      </div>
      <ul className="space-y-1">
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              className={clsx('w-full text-left px-2 py-1 rounded text-sm', currentId === s.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}
              onClick={() => onSelect(s.id)}
              title={new Date(s.createdAt).toLocaleString()}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

