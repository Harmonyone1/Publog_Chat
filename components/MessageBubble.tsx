'use client';
import { ChatMessage } from '../lib/types';

export default function MessageBubble({ m }: { m: ChatMessage }) {
  if (m.role === 'assistant') {
    return (
      <div className="space-y-1">
        <div className="text-sm">{m.content}</div>
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
