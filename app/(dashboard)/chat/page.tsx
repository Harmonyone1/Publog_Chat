'use client';
import { useState } from 'react';
import { ChatMessage, AskResponse } from '../../../lib/types';
import MessageList from '../../../components/MessageList';
import ChatComposer from '../../../components/ChatComposer';
import ViewsRenderer from '../../../components/views/ViewsRenderer';
import ErrorPanel from '../../../components/ErrorPanel';
import ChatHistory from '../../../components/ChatHistory';
import { ask } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';

function AutoRunner({ onAsk, hasUserMessage }: { onAsk: (q: string) => void; hasUserMessage: boolean }) {
  const search = useSearchParams();
  const ran = useRef(false);
  useEffect(() => {
    const q = search?.get('q');
    if (q && !ran.current && !hasUserMessage) {
      ran.current = true;
      onAsk(q);
    }
  }, [search, hasUserMessage, onAsk]);
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastData, setLastData] = useState<AskResponse | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  async function ensureSessionId(title: string): Promise<string> {
    if (sessionId) return sessionId;
    try {
      const res = await fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.slice(0, 60) }) });
      const json = await res.json();
      const id = json?.session?.id as string;
      if (id) setSessionId(id);
      return id || sessionId || '';
    } catch {
      return sessionId || '';
    }
  }

  async function handleAsk(question: string) {
    setMessages((m) => [...m, { id: uid(), role: 'user', content: question, createdAt: Date.now() }]);
    setBusy(true);
    setLastQuestion(question);
    setLastError(null);
    try {
      const sid = await ensureSessionId(question);
      // persist user message
      if (sid) {
        fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, role: 'user', content: question }) });
      }
      const resp = await ask(question);
      if ((resp as any).error) {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: 'Request failed',
            error: (resp as any).error,
            createdAt: Date.now(),
          },
        ]);
        setLastData(null);
        setLastError((resp as any).error);
      } else if (resp.mode === 'chat') {
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'assistant', content: resp.answer, createdAt: Date.now() },
        ]);
        if (sid) {
          fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, role: 'assistant', content: resp.answer }) });
        }
        setLastData(null);
      } else if (resp.mode === 'sql') {
        setMessages((m) => [
          ...m,
          { id: uid(), role: 'assistant', content: 'Here are the results.', createdAt: Date.now() },
        ]);
        if (sid) {
          fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, role: 'assistant', content: 'Here are the results.' }) });
        }
        setLastData(resp);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: 'Unexpected response',
            error: JSON.stringify(resp),
            createdAt: Date.now(),
          },
        ]);
        setLastData(null);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', content: 'Request failed', error: e.message, createdAt: Date.now() },
      ]);
      setLastError(e?.message);
    } finally {
      setBusy(false);
    }
  }

  // Auto-run query is handled by AutoRunner wrapped in Suspense

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 p-2 md:p-4">
        {/* Inline History toggle */}
        <details className="mb-2">
          <summary className="cursor-pointer text-sm text-slate-400">History</summary>
          <div className="mt-2 border border-slate-800 rounded p-2">
            <ChatHistory currentId={sessionId} onSelect={async (id) => {
              setSessionId(id);
              try {
                const res = await fetch(`/api/messages?sessionId=${encodeURIComponent(id)}`, { cache: 'no-store' });
                const json = await res.json();
                const msgs = (json.messages || []).map((m: any) => ({ id: uid(), role: m.role, content: m.content, createdAt: m.ts }));
                setMessages(msgs);
              } catch { setMessages([]); }
            }} onNew={() => {
              setMessages([]); setLastData(null); setLastError(null); setLastQuestion(null);
            }} />
          </div>
        </details>
        <Suspense fallback={null}>
          <AutoRunner onAsk={handleAsk} hasUserMessage={messages.some((m) => m.role === 'user')} />
        </Suspense>
        <MessageList messages={messages} />
        {busy && (
          <div className="text-xs text-slate-400 my-2 animate-pulse">Assistant is thinking...</div>
        )}
        {lastError && <div className="my-2"><ErrorPanel message={lastError} /></div>}
        <ViewsRenderer data={lastData} question={lastQuestion ?? undefined} />
        {/* Quick start cards when no user messages yet */}
        {messages.filter((m) => m.role === 'user').length === 0 && !busy && (
          <div className="grid gap-4 md:grid-cols-3 my-4">
            <div className="bg-slate-900 border border-slate-800 rounded p-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-2">Quick Start</h2>
              <ul className="list-disc pl-5 text-sm text-slate-400">
                <li>Ask: &quot;Top suppliers by revenue in 2022&quot;</li>
                <li>Try: &quot;Average unit price for NIIN 000000057&quot;</li>
                <li>Trend: &quot;Revenue trend for FSC 1680&quot;</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-2">Tips</h2>
              <ul className="list-disc pl-5 text-sm text-slate-400">
                <li>Be specific about dates</li>
                <li>Include NIIN/FSC where relevant</li>
                <li>Limit results if you want speed</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-2">What’s New</h2>
              <ul className="list-disc pl-5 text-sm text-slate-400">
                <li>Saved &amp; History persistence</li>
                <li>Chart export</li>
                <li>Plan-based features</li>
              </ul>
            </div>
          </div>
        )}
        <div className="mt-4">
          <ChatComposer onSend={handleAsk} disabled={busy} />
        </div>
      </div>
    </div>
  );
}
