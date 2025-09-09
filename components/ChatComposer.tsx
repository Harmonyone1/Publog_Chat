'use client';
import { useState } from 'react';

export default function ChatComposer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2">
      <textarea
        className="flex-1 rounded-md bg-slate-900 border border-slate-700 p-2 text-sm resize-none"
        rows={2}
        placeholder="Ask a question..."
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
              onSend(value.trim());
              setValue('');
            }
          }
        }}
      />
      <button
        className="bg-blue-600 text-white text-sm rounded px-3 py-2"
        onClick={() => {
          if (value.trim()) {
            onSend(value.trim());
            setValue('');
          }
        }}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  );
}
