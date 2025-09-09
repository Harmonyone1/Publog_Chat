'use client';
import { FormEvent, useState } from 'react';

export default function SupportPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md grid gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 rounded bg-slate-800"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="p-2 rounded bg-slate-800 h-32"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-blue-600 hover:bg-blue-700 rounded p-2"
      >
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>
      {status === 'sent' && (
        <p className="text-green-400 text-sm">Thanks for reaching out!</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm">Submission failed.</p>
      )}
    </form>
  );
}
