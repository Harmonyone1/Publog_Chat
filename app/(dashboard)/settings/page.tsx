'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, error } = useSWR('/api/me', fetcher);
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
        <ul className="text-sm text-slate-300 space-y-1">
          <li>Timezone: {data.preferences.timezone}</li>
          <li>Currency: {data.preferences.currency}</li>
          <li>Number format: {data.preferences.numberFormat}</li>
          <li>Default window: {data.preferences.defaultWindow}</li>
        </ul>
      </section>
    </div>
  );
}
