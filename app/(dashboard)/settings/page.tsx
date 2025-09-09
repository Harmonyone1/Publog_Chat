'use client';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, error } = useSWR('/api/me', fetcher);
  const [locale, setLocale] = useState('en-US');
  const [currency, setCurrency] = useState('USD');
  useEffect(() => {
    try {
      const l = localStorage.getItem('pref_locale');
      const c = localStorage.getItem('pref_currency');
      if (l) setLocale(l);
      if (c) setCurrency(c);
    } catch {}
  }, []);
  function savePrefs() {
    try {
      localStorage.setItem('pref_locale', locale);
      localStorage.setItem('pref_currency', currency);
    } catch {}
  }
  if (error) return <div>Failed to load settings.</div>;
  if (!data) return <div>Loading settings...</div>;
  return (
    <div className="grid gap-6 max-w-md">
      <section>
        <h2 className="font-semibold mb-2">Profile</h2>
        <p className="text-sm">{data.profile.name}</p>
        <p className="text-sm text-slate-400">{data.profile.email}</p>
      </section>
      <section>
        <h2 className="font-semibold mb-2">Preferences</h2>
        <div className="grid gap-2 text-sm text-slate-300">
          <label className="grid gap-1">
            <span>Number format (locale)</span>
            <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={locale} onChange={(e) => setLocale(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span>Currency</span>
            <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
          <button className="mt-2 px-3 py-2 border border-slate-700 rounded hover:bg-slate-800" onClick={savePrefs}>Save</button>
        </div>
      </section>
    </div>
  );
}
