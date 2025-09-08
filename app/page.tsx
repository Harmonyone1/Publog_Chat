'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, QAResponse } from '../lib/types';
import MessageItem from '../components/MessageItem';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: uid(),
    role: 'assistant',
    content: 'Hi! Ask me about awards, suppliers, NIINs, prices, etc. Example: "Top 10 NIINs by revenue in 2022"',
    createdAt: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const brand = useMemo(() => process.env.NEXT_PUBLIC_APP_NAME || 'PubLog AI', []);

  async function ask(question: string) {
    if (!API_URL) {
      setMessages(m => [...m, { id: uid(), role: 'assistant', content: 'API URL not configured. Set NEXT_PUBLIC_API_URL.', createdAt: Date.now() }]);
      return;
    }
    setBusy(true);
    setMessages(m => [...m, { id: uid(), role: 'user', content: question, createdAt: Date.now() }]);
    setInput('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data: QAResponse | { message?: string } = await res.json();

      if ('answer' in data) {
        const previewRows = data.rows?.slice(0, 5) ?? [];
        setMessages(m => [...m, {
          id: uid(),
          role: 'assistant',
          content: data.answer || '(no answer)',
          sql: data.sql,
          rowsPreview: previewRows,
          columnsPreview: data.columns,
          createdAt: Date.now()
        }]);
      } else {
        setMessages(m => [...m, {
          id: uid(),
          role: 'assistant',
          content: 'The API returned an unexpected response.',
          error: (data as any)?.message,
          createdAt: Date.now()
        }]);
      }
    } catch (e:any) {
      setMessages(m => [...m, {
        id: uid(),
        role: 'assistant',
        content: 'Request failed.',
        error: e?.message || String(e),
        createdAt: Date.now()
      }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <img alt="logo" src="/logo.svg" width={28} height={28} />
        <h1>{brand}</h1>
        <span className="small">Chat over your PubLog (Athena) data</span>
      </div>

      <div className="card chat">
        <div className="messages" ref={listRef}>
          {messages.map(m => (<MessageItem key={m.id} m={m} />))}
        </div>
        <div>
          <div className="inputRow">
            <textarea
              className="input"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) ask(input.trim());
                }
              }}
            />
            <button className="primary" onClick={() => input.trim() && ask(input.trim())} disabled={busy}>
              {busy ? 'Thinking…' : 'Ask'}
            </button>
            <button className="secondary" onClick={() => setMessages(m => m.slice(0,1))} disabled={busy}>Clear</button>
          </div>
          <div className="small" style={{marginTop: 6}}>
            Tip: <code>Top suppliers by revenue (2022)</code>, <code>Average unit price for NIIN 000000057</code>, <code>Revenue trend for FSC 5340 (2020-2024)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
