export default async function HomePage() {
  // Fetch dynamic content from internal APIs for a live feel
  const [insightsRes, datasetsRes, savedRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/insights`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ insights: [] })),
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/datasets`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ datasets: [] })),
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/saved`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ saved: [] })),
  ]);

  return (
    <div className="p-6 grid gap-4 md:grid-cols-3">
      <div className="bg-slate-900 border border-slate-800 rounded p-4 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Quick Start</h2>
        <ul className="list-disc pl-5 text-sm text-slate-400">
          <li>Ask: "Top suppliers by revenue in 2022"</li>
          <li>Try: "Average unit price for NIIN 000000057"</li>
          <li>Trend: "Revenue trend for FSC 1680"</li>
        </ul>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded p-4 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">At a Glance</h2>
        <ul className="text-sm text-slate-400">
          <li>Insights available: {insightsRes.insights?.length ?? 0}</li>
          <li>Datasets: {datasetsRes.datasets?.length ?? 0}</li>
          <li>Saved queries: {savedRes.saved?.length ?? 0}</li>
        </ul>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded p-4 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">What’s New</h2>
        <ul className="list-disc pl-5 text-sm text-slate-400">
          <li>CSV export and SQL toolbar</li>
          <li>Saved queries and history</li>
          <li>Line/Bar chart selection</li>
        </ul>
      </div>
    </div>
  );
}
