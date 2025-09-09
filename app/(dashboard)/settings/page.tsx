'use client';
import { FormEvent, useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, error, mutate } = useSWR('/api/me', fetcher);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [preferences, setPreferences] = useState({
    timezone: '',
    currency: '',
    numberFormat: '',
    defaultWindow: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (data) {
      setProfile(data.profile);
      setPreferences(data.preferences);
    }
  }, [data]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, preferences }),
      });
      if (!res.ok) throw new Error('Request failed');
      await mutate();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  if (error) return <div>Failed to load settings.</div>;
  if (!data) return <div>Loading settings...</div>;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 max-w-md">
      <section className="grid gap-2">
        <h2 className="font-semibold">Profile</h2>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className="p-2 rounded bg-slate-800"
          required
        />
      </section>
      <section className="grid gap-2">
        <h2 className="font-semibold">Preferences</h2>
        <input
          type="text"
          value={preferences.timezone}
          onChange={(e) =>
            setPreferences({ ...preferences, timezone: e.target.value })
          }
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="text"
          value={preferences.currency}
          onChange={(e) =>
            setPreferences({ ...preferences, currency: e.target.value })
          }
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="text"
          value={preferences.numberFormat}
          onChange={(e) =>
            setPreferences({ ...preferences, numberFormat: e.target.value })
          }
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="text"
          value={preferences.defaultWindow}
          onChange={(e) =>
            setPreferences({ ...preferences, defaultWindow: e.target.value })
          }
          className="p-2 rounded bg-slate-800"
          required
        />
      </section>
      <button
        type="submit"
        disabled={status === 'saving'}
        className="bg-blue-600 hover:bg-blue-700 rounded p-2"
      >
        {status === 'saving' ? 'Saving…' : 'Save'}
      </button>
      {status === 'saved' && (
        <p className="text-green-400 text-sm">Settings saved.</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm">Failed to save settings.</p>
      )}
    </form>
  );
}
