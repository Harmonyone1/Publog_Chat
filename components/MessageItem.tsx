'use client';
import { ChatMessage } from '../lib/types';
import clsx from 'clsx';

export default function MessageItem({ m }: { m: ChatMessage }) {
  return (
    <div className={clsx('msg', m.role)}>
      <div className="bubble">
        <div className="meta">{m.role === 'user' ? 'You' : 'Assistant'}</div>
        <div>{m.content}</div>
        {m.sql && (
          <div className="kv">
            <div className="small">SQL generated</div>
            <pre><code>{m.sql}</code></pre>
          </div>
        )}
        {m.columnsPreview && m.rowsPreview && m.rowsPreview.length > 0 && (
          <div className="kv tablewrap">
            <div className="small">Preview</div>
            <table className="preview">
              <thead>
                <tr>
                  {m.columnsPreview.map((c) => (<th key={c}>{c}</th>))}
                </tr>
              </thead>
              <tbody>
                {m.rowsPreview.slice(0, 10).map((r, idx) => (
                  <tr key={idx}>
                    {r.map((v,i) => (<td key={i}>{v ?? ''}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {m.error && (<div className="kv"><span className="small">Error:</span> <code>{m.error}</code></div>)}
      </div>
    </div>
  );
}
