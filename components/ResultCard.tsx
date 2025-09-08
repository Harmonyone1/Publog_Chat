import { AnswerView } from '../lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ResultCard({ view }: { view: AnswerView }) {
  switch (view.type) {
    case 'kpi':
      return (
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="text-sm text-slate-400">{view.title}</div>
          <div className="text-3xl font-bold">
            {view.value}
            {view.unit && <span className="text-base ml-1">{view.unit}</span>}
          </div>
        </div>
      );
    case 'bar':
      return (
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="text-sm text-slate-400 mb-2">{view.title}</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={view.data}>
              <XAxis dataKey={view.encoding.x} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey={view.encoding.y} fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    case 'table':
      return (
        <div className="bg-slate-900 border border-slate-800 rounded p-4 overflow-x-auto">
          <div className="text-sm text-slate-400 mb-2">{view.title}</div>
          <table className="text-sm min-w-full">
            <thead>
              <tr>
                {view.columns.map((c) => (
                  <th key={c} className="text-left px-2 py-1 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-800">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1">{cell as any}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
