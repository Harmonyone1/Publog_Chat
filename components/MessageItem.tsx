'use client';
import { ChatMessage } from '../lib/types';
import ResultCard from './ResultCard';

export default function MessageItem({ m }: { m: ChatMessage }) {
  if (m.role === 'assistant') {
    return (
      <div className="space-y-3">
        <div className="text-sm">{m.content}</div>
        {m.views?.map((v, i) => (
          <ResultCard key={i} view={v} />
        ))}
        {m.explanation && <div className="text-xs text-slate-400">{m.explanation}</div>}
        {m.error && <div className="text-xs text-red-400">{m.error}</div>}
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="bg-blue-600 text-white rounded p-2 max-w-prose">{m.content}</div>
    </div>
  );
}
