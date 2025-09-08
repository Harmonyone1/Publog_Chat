export default function HomePage() {
  const sections = [
    {
      title: 'Examples',
      items: [
        'Top suppliers by revenue in 2022',
        'Average unit price for NIIN 000000057',
        'Revenue trend for FSC 1680'
      ],
    },
    {
      title: 'Capabilities',
      items: [
        'Natural language to charts, tables and KPIs',
        'Optimized for business users',
        'Exports to CSV, XLSX and PNG'
      ],
    },
    {
      title: 'Limitations',
      items: [
        'May return incomplete data',
        'Data updates nightly',
        'No raw SQL shown'
      ],
    },
  ];

  return (
    <main className="p-6 grid gap-4 md:grid-cols-3">
      {sections.map((s) => (
        <div key={s.title} className="bg-slate-900 border border-slate-800 rounded p-4">
          <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
          <ul className="list-disc pl-5 text-sm text-slate-400">
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}
