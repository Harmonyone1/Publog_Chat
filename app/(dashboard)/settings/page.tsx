'use client';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, error } = useSWR('/api/me', fetcher);
  const [locale, setLocale] = useState('en-US');
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [defaultChart, setDefaultChart] = useState<'bar' | 'line'>('bar');
  const [pageSize, setPageSize] = useState<number>(20);
  useEffect(() => {
    // Load from server prefs
    fetch('/api/prefs').then((r) => r.json()).then((j) => {
      const p = j.prefs || {};
      if (p.locale) setLocale(p.locale);
      if (p.currency) setCurrency(p.currency);
      if (p.theme) setTheme(p.theme);
      if (p.defaultChart) setDefaultChart(p.defaultChart);
      if (typeof p.pageSize === 'number') setPageSize(p.pageSize);
    }).catch(() => {});
  }, []);
  function savePrefs() {
    fetch('/api/prefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefs: { locale, currency, theme, defaultChart, pageSize } }) });
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
          <label className="grid gap-1">
            <span>Theme</span>
            <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Default chart</span>
            <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={defaultChart} onChange={(e) => setDefaultChart(e.target.value as any)}>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Table page size</span>
            <input type="number" className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value || '20', 10))} />
          </label>
          <button className="mt-2 px-3 py-2 border border-slate-700 rounded hover:bg-slate-800" onClick={savePrefs}>Save</button>
        </div>
      </section>
    </div>
  );
}
